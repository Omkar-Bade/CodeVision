import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

import Navbar         from '../components/Navbar'
import CodeEditor, { DEFAULT_CODE } from '../components/CodeEditor'
import ExecutionPanel from '../components/ExecutionPanel'
import MemoryView     from '../components/MemoryView'
import Controls       from '../components/Controls'

const API_URL = 'http://localhost:8000'

/* ─── Example programs ─────────────────────────────────────── */
const EXAMPLES = {
  'Variable Copy': `a = 5
b = a
a = 10
print(a, b)`,

  'Loop Sum': `total = 0
for i in range(1, 6):
    total = total + i
print("Sum:", total)`,

  'Conditional': `x = 15
if x > 10:
    result = "big number"
else:
    result = "small number"
print(result)`,

  'String Ops': `name = "Alice"
greeting = "Hello, " + name
length = len(name)
upper = name.upper()
print(greeting)`,

  'Fibonacci': `a = 0
b = 1
for _ in range(6):
    c = a + b
    a = b
    b = c
print(a)`,

  'List Ops': `nums = [3, 1, 4, 1, 5]
nums.append(9)
total = sum(nums)
count = len(nums)
print(total, count)`,
}

/* ─── Error Banner ─────────────────────────────────────────── */
function ErrorBanner({ error, onDismiss }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          className="mx-3 mt-2 bg-red-900/30 border border-red-700/50 rounded-lg p-3
                     flex items-start gap-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <span className="text-red-400 text-sm shrink-0">⚠</span>
          <pre className="text-red-300 text-xs flex-1 overflow-auto whitespace-pre-wrap font-mono">
            {error}
          </pre>
          <button
            onClick={onDismiss}
            className="text-gray-500 hover:text-white shrink-0 text-xs"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function VisualizerPage() {
  const location = useLocation()

  const [code,             setCode]             = useState(() => location.state?.code ?? DEFAULT_CODE)
  const [steps,            setSteps]            = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [isRunning,        setIsRunning]        = useState(false)
  const [isLoading,        setIsLoading]        = useState(false)
  const [speed,            setSpeed]            = useState(700)
  const [output,           setOutput]           = useState('')
  const [error,            setError]            = useState(null)
  const [stale,            setStale]            = useState(false)

  const intervalRef = useRef(null)

  /* Current / previous memory state for animations */
  const currentMemory = currentStepIndex >= 0 ? (steps[currentStepIndex]?.memory ?? {}) : {}
  const prevMemory    = currentStepIndex >  0 ? (steps[currentStepIndex - 1]?.memory ?? {}) : {}

  /* Mark steps as stale when code changes */
  const handleCodeChange = (newCode) => {
    setCode(newCode)
    if (steps.length > 0) setStale(true)
  }

  /* ─── Fetch execution steps from backend ─── */
  const fetchSteps = async (codeToRun) => {
    setIsLoading(true)
    setError(null)
    setSteps([])
    setCurrentStepIndex(-1)
    setOutput('')
    setStale(false)

    try {
      const { data } = await axios.post(`${API_URL}/execute`, { code: codeToRun })
      const { steps: newSteps, output: newOutput, error: newError } = data

      setOutput(newOutput ?? '')

      if (newError) {
        setError(newError)
        setIsLoading(false)
        return null
      }

      setSteps(newSteps ?? [])
      return newSteps
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError(
          'Cannot connect to the CodeVision backend.\n\n' +
          'Make sure the Python server is running:\n' +
          '  cd backend\n' +
          '  pip install fastapi uvicorn\n' +
          '  uvicorn main:app --reload'
        )
      } else {
        setError(err.response?.data?.detail ?? String(err))
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /* ─── Run / Resume ─── */
  const handleRun = async () => {
    if (isRunning) return

    // Resume if we already have steps and haven't reached the end
    if (steps.length > 0 && !stale && currentStepIndex < steps.length - 1) {
      setIsRunning(true)
      return
    }

    const newSteps = await fetchSteps(code)
    if (newSteps && newSteps.length > 0) {
      setIsRunning(true)
    }
  }

  const handlePause  = () => setIsRunning(false)
  const handleNext   = () => setCurrentStepIndex(i => Math.min(i + 1, steps.length - 1))
  const handlePrev   = () => setCurrentStepIndex(i => Math.max(i - 1, 0))
  const handleReset  = () => {
    setIsRunning(false)
    setCurrentStepIndex(-1)
    setSteps([])
    setOutput('')
    setError(null)
    setStale(false)
  }

  /* ─── Load + run an example ─── */
  const loadExample = async (name) => {
    const exCode = EXAMPLES[name]
    setCode(exCode)
    setIsRunning(false)
    setCurrentStepIndex(-1)
    setSteps([])
    setOutput('')
    setError(null)
    setStale(false)

    const newSteps = await fetchSteps(exCode)
    if (newSteps && newSteps.length > 0) setIsRunning(true)
  }

  /* ─── Auto-play interval ─── */
  useEffect(() => {
    if (isRunning && steps.length > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= steps.length - 1) {
            setIsRunning(false)
            return prev
          }
          return prev + 1
        })
      }, speed)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, steps.length, speed])

  /* ─── Auto-run if navigated with code state ─── */
  useEffect(() => {
    if (location.state?.code) {
      fetchSteps(location.state.code).then(newSteps => {
        if (newSteps?.length) setIsRunning(true)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-screen bg-vs-bg text-vs-text flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-col flex-1 pt-14 min-h-0">

        {/* ── Top toolbar: examples ── */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="glass-soft flex items-center gap-2 flex-wrap px-3 py-2 border border-slate-700/70">
          <span className="text-xs text-gray-500 font-mono mr-1">⚡ Quick Examples:</span>
          {Object.keys(EXAMPLES).map(name => (
            <motion.button
              key={name}
              onClick={() => loadExample(name)}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs bg-slate-900/80 border border-slate-700
                         hover:border-vs-blue text-gray-300 hover:text-white rounded-full
                         transition-colors disabled:opacity-40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {name}
            </motion.button>
          ))}

            {stale && (
              <motion.span
                className="ml-2 text-xs text-vs-yellow font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                ⚠ Code changed — click Run to re-execute
              </motion.span>
            )}
          </div>
        </div>

        {/* ── Main 3-column workspace ── */}
        <div className="flex flex-1 min-h-0 gap-3 px-4 pb-3">

          {/* LEFT: Code Editor */}
          <div className="w-1/3 flex flex-col min-h-0">
            <div className="glass-panel flex-1 min-h-0 overflow-hidden">
              <CodeEditor code={code} onChange={handleCodeChange} />
            </div>
          </div>

          {/* CENTER: Execution Panel */}
          <div className="w-1/3 flex flex-col min-h-0">
            <div className="glass-panel flex-1 min-h-0 overflow-hidden">
              <ExecutionPanel
                code={code}
                steps={steps}
                currentStepIndex={Math.max(0, currentStepIndex)}
              />
            </div>
          </div>

          {/* RIGHT: Memory View */}
          <div className="w-1/3 flex flex-col min-h-0">
            <div className="glass-panel flex-1 min-h-0 overflow-hidden">
              <MemoryView memory={currentMemory} prevMemory={prevMemory} />
            </div>
          </div>
        </div>

        {/* ── Bottom bar: console + controls ── */}
        <div className="shrink-0 px-4 pb-4 space-y-2">

          {/* Console */}
          <div className="glass-soft">
            <div className="panel-header">
              <span>Console Output</span>
              {error  && <span className="text-red-400 text-xs">● Error</span>}
              {output && !error && <span className="text-vs-green text-xs">● Output</span>}
            </div>

            <ErrorBanner error={error} onDismiss={() => setError(null)} />

            <div className="px-4 py-2 font-mono text-sm min-h-[3rem] max-h-28 overflow-auto">
              {!error && output ? (
                <pre className="text-vs-green whitespace-pre-wrap">{output}</pre>
              ) : !error && !output ? (
                <span className="text-gray-600">
                  No output. Run your code to see results here.
                </span>
              ) : null}
            </div>
          </div>

          {/* Playback controls */}
          <Controls
            onRun={handleRun}
            onPause={handlePause}
            onNext={handleNext}
            onPrev={handlePrev}
            onReset={handleReset}
            isRunning={isRunning}
            isLoading={isLoading}
            speed={speed}
            onSpeedChange={setSpeed}
            currentStep={Math.max(0, currentStepIndex)}
            totalSteps={steps.length}
          />
        </div>
      </div>
    </div>
  )
}
