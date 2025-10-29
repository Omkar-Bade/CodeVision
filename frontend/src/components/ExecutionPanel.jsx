/**
 * ExecutionPanel.jsx
 *
 * Displays the step-by-step execution view for the currently running code.
 *
 * Responsibilities:
 *   1. Shows a "current step info card" — event type, line number, scope
 *      badge, the source code on that line, and educational annotations
 *      (function calls, returns, type casts, built-ins, exceptions).
 *   2. Renders the full source listing with per-line highlighting:
 *        - Active line  → bright white background + animated ◄ pointer
 *        - Executed     → slightly lighter dim text (already visited)
 *        - Not reached  → dark muted text
 *      The active line is automatically scrolled into view.
 *   3. Renders a "step breadcrumb" footer — a compact grid of coloured
 *      tiles, one per step, visualising progress through the trace.
 *
 * Props:
 *   code             — original Python source string (used to build the listing)
 *   steps            — array of step objects returned by the backend
 *   currentStepIndex — 0-based index of the step currently displayed
 *
 * Annotation types (defined in ANNOTATION_STYLES):
 *   call, return, input, type_cast, builtin, exception
 */
import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ANNOTATION_STYLES = {
  call: { icon: '📞', color: 'text-blue-400', bg: 'bg-blue-900/15', border: 'border-blue-800/40' },
  return: { icon: '↩️', color: 'text-green-400', bg: 'bg-green-900/15', border: 'border-green-800/40' },
  input: { icon: '⌨️', color: 'text-yellow-400', bg: 'bg-yellow-900/15', border: 'border-yellow-800/40' },
  type_cast: { icon: '🔄', color: 'text-cyan-400', bg: 'bg-cyan-900/15', border: 'border-cyan-800/40' },
  builtin: { icon: '⚙️', color: 'text-gray-400', bg: 'bg-gray-900/15', border: 'border-gray-700/40' },
  exception: { icon: '💥', color: 'text-red-400', bg: 'bg-red-900/15', border: 'border-red-800/40' },
}
const DEFAULT_ANN_STYLE = { icon: '•', color: 'text-gray-400', bg: 'bg-[#0d1117]', border: 'border-[#1F2937]' }

const EVENT_LABELS = {
  call: 'Function Call',
  return: 'Return',
  line: 'Executing',
  exception: 'Error',
}

export default function ExecutionPanel({ code, steps, currentStepIndex }) {
  const codeLines = (code || '').split('\n')
  const totalSteps = steps.length
  const step = currentStepIndex >= 0 ? steps[currentStepIndex] : null
  const activeLine = step?.line ?? null
  const annotations = step?.annotations ?? []
  const scope = step?.scope ?? 'global'
  const event = step?.event ?? 'line'
  const lineRefs = useRef({})

  useEffect(() => {
    if (activeLine && lineRefs.current[activeLine]) {
      lineRefs.current[activeLine].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [activeLine])

  const wasExecuted = (lineNum) =>
    steps.slice(0, currentStepIndex + 1).some(s => s.line === lineNum)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="panel-header">
        <span>Execution Viewer</span>
        <span className="text-gray-500">
          {totalSteps > 0
            ? `Step ${Math.max(0, currentStepIndex) + 1} / ${totalSteps}`
            : 'Not running'}
        </span>
      </div>

      {/* Current step info card */}
      <AnimatePresence mode="wait">
        {step ? (
          <motion.div
            key={currentStepIndex}
            className="mx-3 mt-3 rounded-lg p-3 bg-[#0d1117] border border-[#1F2937]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">
                  ▶ {EVENT_LABELS[event] ?? 'Executing'} line {step.line}
                </span>
                {scope && scope !== 'global' && (
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-900/20
                                   border border-blue-700/50 rounded px-1.5 py-0.5">
                    {scope}()
                  </span>
                )}
              </div>
              <span className="text-xs text-blue-400 font-mono">
                Step {step.step}/{totalSteps}
              </span>
            </div>
            <div className="font-mono text-sm">
              <span className="text-yellow-300">{step.code}</span>
            </div>

            {/* Annotations — type casts, function calls, returns, etc. */}
            {annotations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#1F2937] space-y-1">
                {annotations.map((ann, i) => {
                  const style = ANNOTATION_STYLES[ann.type] ?? DEFAULT_ANN_STYLE
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs
                                  font-mono border ${style.bg} ${style.border}`}
                    >
                      <span>{style.icon}</span>
                      <span className={style.color}>{ann.detail}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : totalSteps === 0 ? (
          <div className="mx-3 mt-3 text-center py-4 text-gray-500 text-sm">
            Run your code to see execution steps here.
          </div>
        ) : null}
      </AnimatePresence>

      {/* Code listing with line highlights */}
      <div className="flex-1 overflow-auto px-3 py-3 space-y-px font-mono text-sm">
        {codeLines.map((line, idx) => {
          const num = idx + 1
          const active = activeLine === num
          const done = wasExecuted(num)
          const isEmpty = line.trim() === '' || line.trim().startsWith('#')

          return (
            <div
              key={idx}
              ref={el => (lineRefs.current[num] = el)}
              className={`flex items-start gap-3 px-2 py-0.5 rounded transition-all duration-200
                ${active ? 'line-active' : done && !isEmpty ? 'line-done' : ''}`}
            >
              <span className={`select-none text-right w-5 shrink-0 text-xs pt-0.5
                ${active ? 'text-blue-400' : 'text-gray-600'}`}>
                {num}
              </span>

              <span className={`flex-1 whitespace-pre
                ${active ? 'text-white' : done && !isEmpty ? 'text-gray-300' : 'text-gray-500'}`}>
                {line || ' '}
              </span>

              {active && (
                <motion.span
                  className="text-blue-400 text-xs shrink-0 pt-0.5"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  ◄
                </motion.span>
              )}
            </div>
          )
        })}
      </div>

      {/* Step breadcrumbs */}
      {totalSteps > 0 && (
        <div className="border-t border-[#1F2937] px-3 py-2">
          <div className="text-xs text-gray-500 mb-2 font-mono tracking-widest">
            STEP HISTORY
          </div>
          <div className="flex flex-wrap gap-1">
            {steps.map((s, i) => (
              <div
                key={i}
                title={`Step ${s.step}: line ${s.line} — ${s.code}${s.scope !== 'global' ? ` [${s.scope}()]` : ''}`}
                className={`w-6 h-6 rounded text-xs flex items-center justify-center font-mono
                  cursor-default transition-colors
                  ${i < currentStepIndex
                    ? 'bg-green-500/15 text-green-400'
                    : i === currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1F2937] text-gray-600'}`}
              >
                {s.line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
