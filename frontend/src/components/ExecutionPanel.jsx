import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ExecutionPanel({ code, steps, currentStepIndex }) {
  const codeLines   = (code || '').split('\n')
  const totalSteps  = steps.length
  const step        = currentStepIndex >= 0 ? steps[currentStepIndex] : null
  const activeLine  = step?.line ?? null
  const lineRefs    = useRef({})

  /* Auto-scroll the active line into view */
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
            className="mx-3 mt-3 bg-vs-blue/10 border border-vs-blue/35 rounded-lg p-3"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 font-mono">
                ▶ Executing line {step.line}
              </span>
              <span className="text-xs text-vs-blue font-mono">
                Step {step.step}/{totalSteps}
              </span>
            </div>
            <div className="font-mono text-sm">
              <span className="text-vs-yellow">{step.code}</span>
            </div>
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
          const num     = idx + 1
          const active  = activeLine === num
          const done    = wasExecuted(num)
          const isEmpty = line.trim() === '' || line.trim().startsWith('#')

          return (
            <div
              key={idx}
              ref={el => (lineRefs.current[num] = el)}
              className={`flex items-start gap-3 px-2 py-0.5 rounded transition-all duration-200
                ${active ? 'line-active' : done && !isEmpty ? 'line-done' : ''}`}
            >
              {/* Line number */}
              <span className={`select-none text-right w-5 shrink-0 text-xs pt-0.5
                ${active ? 'text-vs-blue' : 'text-gray-600'}`}>
                {num}
              </span>

              {/* Code text */}
              <span className={`flex-1 whitespace-pre
                ${active ? 'text-white' : done && !isEmpty ? 'text-gray-300' : 'text-gray-500'}`}>
                {line || ' '}
              </span>

              {/* Active arrow */}
              {active && (
                <motion.span
                  className="text-vs-blue text-xs shrink-0 pt-0.5"
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
        <div className="border-t border-vs-border px-3 py-2">
          <div className="text-xs text-gray-500 mb-2 font-mono tracking-widest">
            STEP HISTORY
          </div>
          <div className="flex flex-wrap gap-1">
            {steps.map((s, i) => (
              <div
                key={i}
                title={`Step ${s.step}: line ${s.line} — ${s.code}`}
                className={`w-6 h-6 rounded text-xs flex items-center justify-center font-mono
                  cursor-default transition-colors
                  ${i < currentStepIndex
                    ? 'bg-vs-green/20 text-vs-green'
                    : i === currentStepIndex
                    ? 'bg-vs-blue text-white shadow-blue-glow'
                    : 'bg-vs-border text-gray-600'}`}
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
