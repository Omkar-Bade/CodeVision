import { useEffect } from 'react'
import { motion } from 'framer-motion'

/* ─── Reusable Btn ─────────────────────────────────────────── */
function Btn({ onClick, disabled, title, variant = 'default', children }) {
  const base = 'px-3 py-1.5 rounded text-sm font-mono transition-all duration-150 select-none'
  const variants = {
    primary: 'bg-vs-blue hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed',
    danger:  'bg-red-800/30 hover:bg-red-700/40 text-red-400 border border-red-700/40 disabled:opacity-40',
    default: 'bg-vs-surface hover:bg-vs-border text-vs-text border border-vs-border disabled:opacity-40 disabled:cursor-not-allowed',
  }
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${variants[variant]}`}
      whileHover={!disabled ? { scale: 1.06 } : {}}
      whileTap={!disabled  ? { scale: 0.94 } : {}}
    >
      {children}
    </motion.button>
  )
}

/* ─── Controls ─────────────────────────────────────────────── */
export default function Controls({
  onRun, onPause, onNext, onPrev, onReset,
  isRunning, isLoading,
  speed, onSpeedChange,
  currentStep, totalSteps,
}) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  const atStart  = currentStep <= 0
  const atEnd    = currentStep >= totalSteps - 1

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space')       { e.preventDefault(); isRunning ? onPause() : onRun() }
      if (e.code === 'ArrowRight')  { e.preventDefault(); if (!atEnd)   onNext() }
      if (e.code === 'ArrowLeft')   { e.preventDefault(); if (!atStart) onPrev() }
      if (e.code === 'KeyR' && e.ctrlKey) { e.preventDefault(); onReset() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRunning, atStart, atEnd, onRun, onPause, onNext, onPrev, onReset])

  /* Convert slider: higher position = faster (lower delay) */
  const MAX_DELAY = 2000
  const MIN_DELAY = 80
  const sliderVal = Math.round(((MAX_DELAY - speed) / (MAX_DELAY - MIN_DELAY)) * 100)

  const handleSlider = (e) => {
    const pct   = Number(e.target.value)
    const delay = Math.round(MAX_DELAY - (pct / 100) * (MAX_DELAY - MIN_DELAY))
    onSpeedChange(delay)
  }

  return (
    <div className="bg-vs-surface px-4 py-3 space-y-2">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1 font-mono">
          <span>Progress</span>
          <span>{totalSteps > 0 ? `${currentStep + 1} / ${totalSteps} steps` : '—'}</span>
        </div>
        <div className="h-1.5 bg-vs-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-vs-blue to-vs-green rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Buttons + Speed */}
      <div className="flex items-center gap-2 flex-wrap">
        <Btn onClick={onReset} title="Reset (Ctrl+R)" variant="danger">
          ↺ Reset
        </Btn>

        <div className="h-5 w-px bg-vs-border" />

        <Btn onClick={onPrev} disabled={atStart || totalSteps === 0} title="Previous Step (←)">
          ◄ Prev
        </Btn>

        {isRunning ? (
          <Btn onClick={onPause} variant="primary" title="Pause (Space)">
            ⏸ Pause
          </Btn>
        ) : (
          <Btn
            onClick={onRun}
            disabled={isLoading}
            variant="primary"
            title="Run / Resume (Space)"
          >
            {isLoading ? '⏳ Running…' : '▶ Run'}
          </Btn>
        )}

        <Btn onClick={onNext} disabled={atEnd || totalSteps === 0} title="Next Step (→)">
          Next ►
        </Btn>

        <div className="h-5 w-px bg-vs-border" />

        {/* Speed slider */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">🐢</span>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderVal}
            onChange={handleSlider}
            className="w-24"
            title="Execution speed"
          />
          <span className="text-xs text-gray-500">🐇</span>
          <span className="text-xs text-gray-400 font-mono w-14 text-right">
            {speed < 1000 ? `${speed}ms` : `${(speed / 1000).toFixed(1)}s`}
          </span>
        </div>

        {/* Keyboard hint */}
        <span className="text-xs text-gray-600 font-mono ml-2 hidden lg:block">
          Space · ← →
        </span>
      </div>
    </div>
  )
}
