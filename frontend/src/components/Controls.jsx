/**
 * Controls.jsx
 *
 * Playback control bar for the CodeVision visualizer.
 *
 * Props:
 *   onRun          — called to fetch steps and start auto-play
 *   onPause        — called to pause auto-play
 *   onNext         — advance one step forward
 *   onPrev         — go one step backward
 *   onReset        — clear all steps and reset state
 *   isRunning      — true while auto-play interval is active
 *   isLoading      — true while the backend is processing code
 *   speed          — current auto-play interval in milliseconds
 *   onSpeedChange  — callback that receives the new delay in ms
 *   currentStep    — 0-based index of the currently displayed step
 *   totalSteps     — total number of execution steps for this run
 *
 * Keyboard shortcuts (global, ignored when focus is inside an editor):
 *   Space      → toggle play / pause
 *   ←          → previous step
 *   →          → next step
 *   Ctrl + R   → reset / restart
 *
 * Speed slider mapping:
 *   slider 0   → MAX_DELAY (2000 ms — slowest)
 *   slider 100 → MIN_DELAY (80 ms  — fastest)
 *   The inversion makes "left = slow, right = fast" feel natural.
 */
import { useEffect } from 'react'
import { motion } from 'framer-motion'

/* ─── Reusable Btn ─────────────────────────────────────────── */
function Btn({ onClick, disabled, title, variant = 'default', children }) {
  const base = 'neon-btn text-xs sm:text-sm'
  const variants = {
    primary: 'neon-btn-primary',
    danger: 'neon-btn-danger',
    default: 'neon-btn-muted',
  }
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${variants[variant]}`}
      whileHover={!disabled ? { scale: 1.06 } : {}}
      whileTap={!disabled ? { scale: 0.94 } : {}}
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
  const atStart = currentStep <= 0
  const atEnd = currentStep >= totalSteps - 1

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.target.closest?.('.monaco-editor')) return   // let Monaco handle all its own keys
      if (e.code === 'Space') { e.preventDefault(); isRunning ? onPause() : onRun() }
      if (e.code === 'ArrowRight') { e.preventDefault(); if (!atEnd) onNext() }
      if (e.code === 'ArrowLeft') { e.preventDefault(); if (!atStart) onPrev() }
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
    const pct = Number(e.target.value)
    const delay = Math.round(MAX_DELAY - (pct / 100) * (MAX_DELAY - MIN_DELAY))
    onSpeedChange(delay)
  }

  return (
    <div className="glass-soft px-4 py-3 space-y-2">
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
        <Btn onClick={onReset} title="Restart (Ctrl+R)" variant="danger">
          🔁 Restart
        </Btn>

        <div className="h-5 w-px bg-vs-border" />

        <Btn onClick={onPrev} disabled={atStart || totalSteps === 0} title="Previous Step (←)">
          ⏮ Step Back
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
          ⏭ Step
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
