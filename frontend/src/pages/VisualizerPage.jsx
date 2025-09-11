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

// react-resizable-panels v4 renamed its exports:
//   PanelGroup → Group  |  PanelResizeHandle → Separator
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'

import Navbar         from '../components/Navbar'
import CodeEditor, { DEFAULT_CODE } from '../components/CodeEditor'
import ExecutionPanel from '../components/ExecutionPanel'
import MemoryView     from '../components/MemoryView'

// FastAPI backend base URL
const API_URL = 'http://localhost:8000'

// Speed slider maps 0–100 (slider position) to MAX_DELAY–MIN_DELAY ms (execution interval).
// Slider left = slowest (2 s per step), slider right = fastest (80 ms per step).
const MAX_DELAY = 2000   // ms — slowest execution speed
const MIN_DELAY = 80     // ms — fastest execution speed

/* ─────────────────────────────────────────────────────────────────
   Quick-example snippets shown in the toolbar.
   Each entry is loaded into the editor and immediately executed
   when the user clicks the pill button.
───────────────────────────────────────────────────────────────── */
const EXAMPLES = {
  'Variable Copy': `a = 5\nb = a\na = 10\nprint(a, b)`,
  'Loop Sum':      `total = 0\nfor i in range(1, 6):\n    total = total + i\nprint("Sum:", total)`,
  'Conditional':   `x = 15\nif x > 10:\n    result = "big number"\nelse:\n    result = "small number"\nprint(result)`,
  'String Ops':    `name = "Alice"\ngreeting = "Hello, " + name\nlength = len(name)\nupper = name.upper()\nprint(greeting)`,
  'Fibonacci':     `a = 0\nb = 1\nfor _ in range(6):\n    c = a + b\n    a = b\n    b = c\nprint(a)`,
  'List Ops':      `nums = [3, 1, 4, 1, 5]\nnums.append(9)\ntotal = sum(nums)\ncount = len(nums)\nprint(total, count)`,
}

/* ─────────────────────────────────────────────────────────────────
   TBtn — compact toolbar button used for playback controls.
   Accepts three visual variants: 'primary' (run/pause), 'danger'
   (restart), and 'muted' (step navigation).
───────────────────────────────────────────────────────────────── */
function TBtn({ onClick, disabled, title, variant = 'muted', children }) {
  const cls = {
    primary: 'bg-sky-600/30 text-sky-100 border-sky-500/60 hover:bg-sky-600/50',
    danger:  'bg-red-700/20  text-red-300  border-red-600/50  hover:bg-red-700/35',
    muted:   'bg-slate-800/80 text-slate-200 border-slate-600/60 hover:bg-slate-700/80',
  }[variant]

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono
                  font-semibold border transition-colors duration-150 outline-none
                  disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled   ? { scale: 0.95 } : {}}
    >
      {children}
    </motion.button>
  )
}

/* ─────────────────────────────────────────────────────────────────
   VisualizerPage — main exported component
───────────────────────────────────────────────────────────────── */
export default function VisualizerPage() {
  const location = useLocation()

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
  const [code,             setCode]             = useState(() => location.state?.code ?? DEFAULT_CODE)
  const [steps,            setSteps]            = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isRunning,        setIsRunning]        = useState(false)
  const [isLoading,        setIsLoading]        = useState(false)
  const [speed,            setSpeed]            = useState(700)
  const [output,           setOutput]           = useState('')
  const [error,            setError]            = useState(null)
  const [stale,            setStale]            = useState(false)

  // editorVisible – toggles the Monaco Editor panel on/off
  const [editorVisible, setEditorVisible] = useState(true)

  // intervalRef  – holds the setInterval ID for auto-play; cleared on pause/reset
  // consoleRef   – DOM ref used to scroll the console into view on error
  const intervalRef = useRef(null)
  const consoleRef  = useRef(null)

  // ── Derived values ───────────────────────────────────────────
  // currentMemory – variables at the current step (shown in MemoryView)
  // prevMemory    – variables at the previous step (used to detect changes/new vars)
  // progress      – 0–100 percentage for the animated progress bar
  // atStart/atEnd – boundary checks to disable step-back / step-forward buttons
  // sliderVal     – converts the ms delay back to a 0-100 slider position
  const currentMemory = currentStepIndex >= 0 ? (steps[currentStepIndex]?.memory ?? {}) : {}
  const prevMemory    = currentStepIndex >  0 ? (steps[currentStepIndex - 1]?.memory ?? {}) : {}
  const progress      = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0
  const atStart       = currentStepIndex <= 0
  const atEnd         = currentStepIndex >= steps.length - 1
  const sliderVal     = Math.round(((MAX_DELAY - speed) / (MAX_DELAY - MIN_DELAY)) * 100)

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

      if (e.code === 'Space')      { e.preventDefault(); isRunning ? handlePause() : handleRun() }
      if (e.code === 'ArrowRight') { e.preventDefault(); if (!atEnd)   handleNext() }
      if (e.code === 'ArrowLeft')  { e.preventDefault(); if (!atStart) handlePrev() }
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
      const { data } = await axios.post(`${API_URL}/execute`, { code: src })
      setOutput(data.output ?? '')
      if (data.error) { setError(data.error); return null }
      setSteps(data.steps ?? [])
      return data.steps
    } catch (err) {
      // Distinguish a missing backend from other API errors
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
  const handleNext  = () => setCurrentStepIndex(i => Math.min(i + 1, steps.length - 1))
  const handlePrev  = () => setCurrentStepIndex(i => Math.max(i - 1, 0))

  const handleReset = () => {
    setIsRunning(false); setCurrentStepIndex(-1); setSteps([])
    setOutput(''); setError(null); setStale(false)
  }

  // Load an example: set code → fetch steps → start auto-play
  const loadExample = async (name) => {
    const ex = EXAMPLES[name]
    setCode(ex); setIsRunning(false); setCurrentStepIndex(-1)
    setSteps([]); setOutput(''); setError(null); setStale(false)
    const s = await fetchSteps(ex)
    if (s?.length) setIsRunning(true)
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

      {/* Main content starts below the fixed navbar (pt-14 = 56 px) */}
      <div className="pt-14 flex flex-col">

        {/* ──────────────────────────────────────────────────────
            STICKY TOOLBAR
            Stays pinned below the navbar while the user scrolls.
            Left side  → editor toggle + quick example pills + stale warning
            Right side → playback controls + speed slider
        ────────────────────────────────────────────────────── */}
        <div className="sticky top-14 z-40 bg-vs-bg/95 backdrop-blur-xl
                        border-b border-slate-800/70 px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap min-h-[2.25rem]">

            {/* Toggle button — hides/shows the Monaco Editor panel */}
            <button
              onClick={() => setEditorVisible(v => !v)}
              title={editorVisible ? 'Hide Editor' : 'Show Editor'}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border
                          font-mono transition-colors duration-150 shrink-0
                          ${editorVisible
                            ? 'bg-sky-600/20 border-sky-500/50 text-sky-300'
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'}`}
            >
              {/* Code brackets icon */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              {editorVisible ? 'Hide Editor' : 'Show Editor'}
            </button>

            <div className="w-px h-4 bg-slate-700/80 shrink-0" />

            {/* Quick-example pill buttons */}
            <span className="text-xs text-gray-500 font-mono shrink-0">⚡</span>
            {Object.keys(EXAMPLES).map(name => (
              <motion.button
                key={name}
                onClick={() => loadExample(name)}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs bg-slate-900/80 border border-slate-700
                           hover:border-vs-blue text-gray-300 hover:text-white rounded-full
                           transition-colors disabled:opacity-40 shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {name}
              </motion.button>
            ))}

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

              <div className="w-px h-4 bg-slate-700/60" />

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

              <div className="w-px h-4 bg-slate-700/60" />

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

              {/* Keyboard hint — hidden on small screens */}
              <span className="text-xs text-gray-600 font-mono hidden xl:block ml-1">
                Space · ← →
              </span>
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
        <div className="px-4 pt-3 pb-1" style={{ height: 'calc(100vh - 7.75rem)' }}>
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
                <MemoryView memory={currentMemory} prevMemory={prevMemory} />
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
          <div className="glass-soft px-4 py-2.5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-mono">
              <span>Progress</span>
              <span>
                {steps.length > 0
                  ? `Step ${currentStepIndex + 1} of ${steps.length}`
                  : '— Not running'}
              </span>
            </div>
            {/* Animated fill bar driven by the `progress` derived value (0–100) */}
            <div className="h-1.5 bg-vs-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-vs-blue to-vs-green rounded-full"
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
          <div className="glass-soft overflow-hidden">

            {/* Status header: shows a coloured dot for Error / Output / Idle */}
            <div className="panel-header">
              <span className="font-mono text-[11px]">Console Output</span>
              <div className="flex items-center gap-2">
                {error             && <span className="text-red-400   text-[10px] font-mono">● Error</span>}
                {output && !error  && <span className="text-vs-green  text-[10px] font-mono">● Output</span>}
                {!error && !output && <span className="text-slate-600 text-[10px] font-mono">● Idle</span>}
              </div>
            </div>

            {/* Animated error block with dismiss button */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mx-3 mt-2 bg-red-900/25 border border-red-700/40
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
                    className="text-slate-500 hover:text-white shrink-0 text-xs"
                  >
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* stdout output from print() statements */}
            <div className="px-4 py-3 font-mono text-sm min-h-[3rem]">
              {!error && output ? (
                <pre className="text-vs-green whitespace-pre-wrap">{output}</pre>
              ) : !error ? (
                <span className="text-slate-600">
                  No output yet. Run your code to see results here.
                </span>
              ) : null}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
