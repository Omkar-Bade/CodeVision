/**
 * VisualizerPage.jsx
 *
 * The main workspace of CodeVision.
 *
 * Layout (top → bottom):
 *   1. Sticky Toolbar   – editor toggle, quick-example buttons, playback controls, speed slider
 *   2. Main Panels      – Monaco Editor | Execution Viewer | Memory Visualization (horizontally resizable)
 *   3. Progress Bar     – animated step tracker (visible on scroll)
 *   4. Console Output   – print() output and runtime errors (visible on scroll)
 *
 * The page uses `min-h-screen` so users can scroll down to reach the console,
 * while the main panels always fill the visible viewport height.
 */

import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// react-resizable-panels v4 renamed its exports:
//   PanelGroup → Group  |  PanelResizeHandle → Separator
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CodeEditor, { DEFAULT_CODE } from '../components/CodeEditor'
import ExecutionPanel from '../components/ExecutionPanel'
import MemoryView from '../components/MemoryView'

// Python FastAPI execution service URL
const API_URL = 'http://localhost:8000'

// Speed slider maps 0–100 (slider position) to MAX_DELAY–MIN_DELAY ms (execution interval).
// Slider left = slowest (2 s per step), slider right = fastest (80 ms per step).
const MAX_DELAY = 2000   // ms — slowest execution speed
const MIN_DELAY = 80     // ms — fastest execution speed


/* ─────────────────────────────────────────────────────────────────
   TBtn — compact toolbar button used for playback controls.
   Accepts three visual variants: 'primary' (run/pause), 'danger'
   (restart), and 'muted' (step navigation).
───────────────────────────────────────────────────────────────── */
function TBtn({ onClick, disabled, title, variant = 'muted', children }) {
  const cls = {
    primary: 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500',
    danger: 'bg-transparent text-red-400 border-red-800 hover:bg-red-900/30',
    muted: 'bg-transparent text-gray-300 border-[#374151] hover:bg-[#1F2937] hover:text-white',
  }[variant]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono
                  font-medium border transition-colors duration-150 outline-none
                  disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────────────────────────────────────────
   VisualizerPage — main exported component
───────────────────────────────────────────────────────────────── */
export default function VisualizerPage() {
  const location = useLocation()
  const { user } = useAuth()

  // ── Execution state ──────────────────────────────────────────
  // code          – current text in the Monaco editor
  // steps         – array of execution snapshots returned by the backend
  // currentStep   – index into `steps` currently displayed (-1 = not started)
  // isRunning     – true while auto-play interval is ticking
  // isLoading     – true while waiting for the backend response
  // speed         – auto-play interval in ms (controlled by the slider)
  // output        – stdout captured from the user's code (print statements)
  // error         – error message string when execution fails
  // stale         – true when the editor code has changed since the last run
  const [code, setCode] = useState(() => location.state?.code ?? DEFAULT_CODE)
  const [steps, setSteps] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [speed, setSpeed] = useState(700)
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)
  const [stale, setStale] = useState(false)

  // editorVisible – toggles the Monaco Editor panel on/off
  const [editorVisible, setEditorVisible] = useState(true)

  // saveStatus – feedback state for the Save Code button
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'error'

  // inputValues – comma-separated string of values fed to input() calls during execution
  const [inputValues, setInputValues] = useState('')

  // intervalRef  – holds the setInterval ID for auto-play; cleared on pause/reset
  // consoleRef   – DOM ref used to scroll the console into view on error
  const intervalRef = useRef(null)
  const consoleRef = useRef(null)

  // ── Derived values ───────────────────────────────────────────
  // currentMemory – variables at the current step (shown in MemoryView)
  // prevMemory    – variables at the previous step (used to detect changes/new vars)
  // progress      – 0–100 percentage for the animated progress bar
  // atStart/atEnd – boundary checks to disable step-back / step-forward buttons
  // sliderVal     – converts the ms delay back to a 0-100 slider position
  const currentMemory = currentStepIndex >= 0 ? (steps[currentStepIndex]?.memory ?? {}) : {}
  const prevMemory = currentStepIndex > 0 ? (steps[currentStepIndex - 1]?.memory ?? {}) : {}
  const currentScope = currentStepIndex >= 0 ? (steps[currentStepIndex]?.scope ?? 'global') : 'global'
  const callStack = currentStepIndex >= 0 ? (steps[currentStepIndex]?.call_stack ?? []) : []
  const progress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0
  const atStart = currentStepIndex <= 0
  const atEnd = currentStepIndex >= steps.length - 1
  const sliderVal = Math.round(((MAX_DELAY - speed) / (MAX_DELAY - MIN_DELAY)) * 100)

  // Mark steps stale whenever the editor content changes after a run.
  // This prompts the user to re-run before stepping.
  const handleCodeChange = (v) => { setCode(v); if (steps.length > 0) setStale(true) }

  // Convert slider position (0–100) back to a delay in ms using a linear scale.
  const handleSlider = (e) => {
    const pct = Number(e.target.value)
    setSpeed(Math.round(MAX_DELAY - (pct / 100) * (MAX_DELAY - MIN_DELAY)))
  }

  // ── Auto-scroll console into view whenever an error is set ───
  // A short delay ensures the error block has rendered before scrolling.
  useEffect(() => {
    if (error) {
      setTimeout(() => consoleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }, [error])

  // ── Global keyboard shortcuts ────────────────────────────────
  // Space    → play / pause
  // ←  / →  → step backward / forward
  // Ctrl+R   → reset
  // Guard clauses skip Monaco editor inputs and regular form inputs so
  // typing in the editor never triggers these shortcuts.
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.target.closest?.('.monaco-editor')) return   // let Monaco handle its own keys

      if (e.code === 'Space') { e.preventDefault(); isRunning ? handlePause() : handleRun() }
      if (e.code === 'ArrowRight') { e.preventDefault(); if (!atEnd) handleNext() }
      if (e.code === 'ArrowLeft') { e.preventDefault(); if (!atStart) handlePrev() }
      if (e.code === 'KeyR' && e.ctrlKey) { e.preventDefault(); handleReset() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, atStart, atEnd, steps.length, currentStepIndex])

  // ── Fetch execution steps from backend ───────────────────────
  // POST /execute with the current code; backend returns:
  //   { steps: [{line, code, memory, output}], output: string, error: string|null }
  // Each step is a snapshot of the interpreter state at that line.
  const fetchSteps = async (src) => {
    setIsLoading(true); setError(null); setSteps([])
    setCurrentStepIndex(-1); setOutput(''); setStale(false)
    try {
      const inputs = inputValues.trim()
        ? inputValues.split(',').map(s => s.trim())
        : undefined
      const { data } = await axios.post(`${API_URL}/execute`, { code: src, inputs })
      const capturedOutput = data.output ?? ''
      setOutput(capturedOutput)
      if (data.error) { setError(data.error); return null }
      setSteps(data.steps ?? [])

      // Persist execution to Supabase (best-effort — don't block on failure)
      if (user) {
        supabase.from('execution_history').insert({
          user_id: user.id,
          code: src,
          output: capturedOutput,
        }).then(({ error: dbErr }) => {
          if (dbErr) console.warn('Could not save execution history:', dbErr.message)
        })
      }

      return data.steps
    } catch (err) {
      setError(
        err.code === 'ERR_NETWORK'
          ? 'Cannot connect to the backend.\n\nRun:\n  cd backend\n  python -m uvicorn main:app --reload'
          : (err.response?.data?.detail ?? String(err))
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // ── Playback handlers ────────────────────────────────────────
  const handleRun = async () => {
    if (isRunning) return
    // If steps are already loaded and not stale, just resume auto-play
    // instead of re-fetching from the backend.
    if (steps.length > 0 && !stale && currentStepIndex < steps.length - 1) {
      setIsRunning(true); return
    }
    const s = await fetchSteps(code)
    if (s?.length) setIsRunning(true)
  }

  const handlePause = () => setIsRunning(false)

  // Clamp to valid index range to avoid out-of-bounds access.
  const handleNext = () => setCurrentStepIndex(i => Math.min(i + 1, steps.length - 1))
  const handlePrev = () => setCurrentStepIndex(i => Math.max(i - 1, 0))

  const handleReset = () => {
    setIsRunning(false); setCurrentStepIndex(-1); setSteps([])
    setOutput(''); setError(null); setStale(false)
  }

  // Save the current editor code to the saved_codes table
  const handleSaveCode = async () => {
    if (!user || saveStatus === 'saving') return
    setSaveStatus('saving')
    const { error: dbErr } = await supabase.from('saved_codes').insert({
      user_id: user.id,
      code: code,
      language: 'python',
    })
    if (dbErr) {
      console.warn('Save failed:', dbErr.message)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
    }
    // Reset button label after 2 s
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  // ── Auto-play interval ───────────────────────────────────────
  // Advances one step every `speed` ms while isRunning is true.
  // Automatically stops when the last step is reached.
  useEffect(() => {
    if (isRunning && steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= steps.length - 1) { setIsRunning(false); return prev }
          return prev + 1
        })
      }, speed)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, steps.length, speed])

  // ── Auto-run when navigated from Tutorials/Courses with code ─
  // React Router passes { state: { code } } when "Run in Visualizer" is clicked.
  useEffect(() => {
    if (location.state?.code) {
      fetchSteps(location.state.code).then(s => { if (s?.length) setIsRunning(true) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Panel default sizes change when the editor is hidden so the two remaining
  // panels split the full width evenly.
  const hSizes = editorVisible
    ? { editor: 30, exec: 38, mem: 32 }
    : { exec: 50, mem: 50 }

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-vs-bg text-vs-text">
      <Navbar />

      {/* Main content starts below the fixed navbar (pt-16 = 64 px) */}
      <div className="pt-16 flex flex-col">

        {/* ──────────────────────────────────────────────────────
            STICKY TOOLBAR
            Stays pinned below the navbar while the user scrolls.
            Left side  → editor toggle + quick example pills + stale warning
            Right side → playback controls + speed slider
        ────────────────────────────────────────────────────── */}
        <div className="sticky top-16 z-40 bg-[#111827] border-b border-[#1F2937] px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-h-[2.25rem]">

            {/* Toggle button — hides/shows the Monaco Editor panel */}
            <button
              onClick={() => setEditorVisible(v => !v)}
              title={editorVisible ? 'Hide Editor' : 'Show Editor'}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border
                          font-mono transition-colors duration-150 shrink-0
                          ${editorVisible
                  ? 'bg-blue-600/15 border-blue-600/40 text-blue-400'
                  : 'bg-transparent border-[#374151] text-gray-400 hover:text-white hover:bg-[#1F2937]'}`}
            >
              {/* Code brackets icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              {editorVisible ? 'Hide Editor' : 'Show Editor'}
            </button>

            <div className="w-px h-4 bg-[#374151] shrink-0" />

            {/* Save Code button — persists current editor code to Supabase */}
            <button
              onClick={handleSaveCode}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border
                          font-mono transition-colors duration-150 shrink-0 disabled:opacity-50
                          ${saveStatus === 'saved'
                  ? 'bg-green-600/15 border-green-600/40 text-green-400'
                  : saveStatus === 'error'
                    ? 'bg-red-600/15 border-red-600/40 text-red-400'
                    : 'bg-transparent border-[#374151] text-gray-400 hover:text-white hover:bg-[#1F2937]'}`}
            >
              {saveStatus === 'saving' ? '💾 Saving…'
                : saveStatus === 'saved' ? '✓ Saved!'
                  : saveStatus === 'error' ? '✕ Failed'
                    : '💾 Save Code'}
            </button>

            <div className="w-px h-4 bg-[#374151] shrink-0" />

            {/* Input simulation field — values fed to input() calls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-gray-500 font-mono" title="Values for input() calls, comma-separated">⌨️</span>
              <input
                type="text"
                value={inputValues}
                onChange={e => setInputValues(e.target.value)}
                placeholder="input values…"
                title="Comma-separated values fed to input() calls"
                className="w-28 px-2 py-0.5 text-xs bg-[#0B1120] border border-[#374151]
                           rounded-md text-gray-300 placeholder-gray-600
                           focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            {/* Stale warning — shown when code was edited after the last run */}
            {stale && (
              <motion.span
                className="text-xs text-vs-yellow font-mono"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                ⚠ Code changed — click Run
              </motion.span>
            )}

            {/* ── Playback Controls (right-aligned) ─────────────
                All execution buttons live here so the user never
                needs to scroll down to control playback.
            ─────────────────────────────────────────────────── */}
            <div className="ml-auto flex items-center gap-1.5 shrink-0">

              {/* Reset clears all steps and execution state */}
              <TBtn onClick={handleReset} variant="danger" title="Restart (Ctrl+R)">
                🔁 Restart
              </TBtn>

              <div className="w-px h-4 bg-[#374151]" />

              {/* Step backward through execution history */}
              <TBtn
                onClick={handlePrev}
                disabled={atStart || steps.length === 0}
                title="Step Back (←)"
              >
                ⏮ Step Back
              </TBtn>

              {/* Run/Pause — single button that toggles based on isRunning */}
              {isRunning ? (
                <TBtn onClick={handlePause} variant="primary" title="Pause (Space)">
                  ⏸ Pause
                </TBtn>
              ) : (
                <TBtn onClick={handleRun} disabled={isLoading} variant="primary"
                  title="Run / Resume (Space)">
                  {isLoading ? '⏳ Running…' : '▶ Run'}
                </TBtn>
              )}

              {/* Step forward through execution history */}
              <TBtn
                onClick={handleNext}
                disabled={atEnd || steps.length === 0}
                title="Next Step (→)"
              >
                ⏭ Step
              </TBtn>

              <div className="w-px h-4 bg-[#374151]" />

              {/* Speed slider: left = slow (2 s), right = fast (80 ms) */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500" title="Slow">🐢</span>
                <input
                  type="range" min={0} max={100} value={sliderVal}
                  onChange={handleSlider}
                  className="w-20" title="Execution speed"
                />
                <span className="text-xs text-gray-500" title="Fast">🐇</span>
                <span className="text-xs text-gray-400 font-mono w-12 text-right">
                  {speed < 1000 ? `${speed}ms` : `${(speed / 1000).toFixed(1)}s`}
                </span>
              </div>


            </div>

          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            MAIN PANELS — fills the remaining viewport height.
            height = 100vh  minus  navbar (56px) + toolbar (~68px) + padding.
            react-resizable-panels handles the drag-to-resize logic.
            Monaco's `automaticLayout: true` makes it reflow automatically
            when its container resizes.

            Panel order:  Editor  |  Execution Viewer  |  Memory Visualization
            The editor panel is conditionally rendered; when hidden the other
            two panels expand to fill the full width (via the `key` reset).
        ────────────────────────────────────────────────────── */}
        <div className="px-4 pt-3 pb-1" style={{ height: 'calc(100vh - 8.25rem)' }}>
          <PanelGroup
            // Changing the key forces PanelGroup to remount so panel sizes reset
            // correctly when the editor is toggled.
            key={editorVisible ? 'with-editor' : 'no-editor'}
            orientation="horizontal"
            className="h-full"
          >
            {/* Monaco Editor — conditionally rendered with a slide animation */}
            <AnimatePresence initial={false}>
              {editorVisible && (
                <>
                  <Panel defaultSize={hSizes.editor} minSize={15} className="flex flex-col">
                    <motion.div
                      className="glass-panel h-full overflow-hidden"
                      initial={{ opacity: 0, scaleX: 0.96 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0.96 }}
                      transition={{ duration: 0.16 }}
                      style={{ transformOrigin: 'left' }}
                    >
                      <CodeEditor code={code} onChange={handleCodeChange} />
                    </motion.div>
                  </Panel>
                  {/* Draggable divider between Editor and Execution Viewer */}
                  <PanelResizeHandle className="resize-handle-x" />
                </>
              )}
            </AnimatePresence>

            {/* Execution Viewer — highlights the current line and shows step info */}
            <Panel defaultSize={hSizes.exec} minSize={20} className="flex flex-col">
              <div className="glass-panel h-full overflow-hidden">
                <ExecutionPanel
                  code={code}
                  steps={steps}
                  currentStepIndex={Math.max(0, currentStepIndex)}
                />
              </div>
            </Panel>

            {/* Draggable divider between Execution Viewer and Memory Visualization */}
            <PanelResizeHandle className="resize-handle-x" />

            {/* Memory Visualization — shows variable names, values and change animations */}
            <Panel defaultSize={hSizes.mem} minSize={20} className="flex flex-col">
              <div className="glass-panel h-full overflow-hidden">
                <MemoryView
                  memory={currentMemory}
                  prevMemory={prevMemory}
                  callStack={callStack}
                  scope={currentScope}
                />
              </div>
            </Panel>
          </PanelGroup>
        </div>

        {/* ──────────────────────────────────────────────────────
            PROGRESS BAR
            Visible when the user scrolls below the main panels.
            Animates smoothly as currentStepIndex advances.
        ────────────────────────────────────────────────────── */}
        <div className="px-4 pt-3">
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl px-4 py-2.5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-mono">
              <span>Progress</span>
              <span>
                {steps.length > 0
                  ? `Step ${currentStepIndex + 1} of ${steps.length}`
                  : '— Not running'}
              </span>
            </div>
            <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            CONSOLE OUTPUT
            Shows stdout from print() statements and any runtime
            errors. Automatically scrolled into view when an error
            is detected (see the useEffect above).
        ────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 pb-12" ref={consoleRef}>
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden">

            {/* Status header */}
            <div className="panel-header">
              <span className="font-mono text-[11px]">Console Output</span>
              <div className="flex items-center gap-2">
                {error && <span className="text-red-400  text-[10px] font-mono">● Error</span>}
                {output && !error && <span className="text-green-400 text-[10px] font-mono">● Output</span>}
                {!error && !output && <span className="text-gray-600 text-[10px] font-mono">● Idle</span>}
              </div>
            </div>

            {/* Error block */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mx-3 mt-2 bg-red-950/40 border border-red-800/60
                             rounded-lg p-3 flex items-start gap-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span className="text-red-400 text-sm shrink-0">⚠</span>
                  <pre className="text-red-300 text-xs flex-1 overflow-auto whitespace-pre-wrap font-mono">
                    {error}
                  </pre>
                  <button
                    onClick={() => setError(null)}
                    className="text-gray-500 hover:text-white shrink-0 text-xs"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* stdout output */}
            <div className="px-4 py-3 font-mono text-sm min-h-[3rem]">
              {!error && output ? (
                <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
              ) : !error ? (
                <span className="text-gray-600">
                  No output yet. Run your code to see results here.
                </span>
              ) : null}
            </div>

          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}
