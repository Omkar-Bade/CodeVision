/**
 * MemoryView.jsx
 *
 * Renders the "Memory State" panel — an animated grid of variable cards
 * showing the name, value, Python type, and memory allocation for each
 * variable at the current execution step.
 *
 * Data shape received from the backend (per variable):
 *   memory = {
 *     "a": { value: 5,       size_bytes: 28,  type: "int"  },
 *     "b": { value: "hello", size_bytes: 54,  type: "str"  },
 *     "c": { value: [1,2,3], size_bytes: 88,  type: "list" },
 *     ...
 *   }
 *
 * size_bytes is the *shallow* sys.getsizeof() measurement — the bytes
 * CPython allocates for the object itself, not its nested contents.
 */

import { motion, AnimatePresence } from 'framer-motion'

// ── Helper: format bytes → human-readable string ────────────────────────────
/**
 * Convert a raw byte count to a tidy display string.
 *   0–1023  → "28 B"
 *   ≥ 1024  → "1.2 KB"
 */
function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '? B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

// ── Helper: choose badge colour based on memory size ────────────────────────
/**
 * Returns a Tailwind colour class set so users can visually gauge
 * how "heavy" a variable is relative to others:
 *   small  (< 100 B)   → green
 *   medium (100–500 B) → yellow
 *   large  (> 500 B)   → orange
 */
function sizeColour(bytes) {
  if (!bytes) return 'text-slate-400 bg-slate-800/60 border-slate-700/60'
  if (bytes < 100)  return 'text-emerald-300 bg-emerald-900/30 border-emerald-600/40'
  if (bytes < 500)  return 'text-yellow-300  bg-yellow-900/30  border-yellow-600/40'
  return                   'text-orange-300  bg-orange-900/30  border-orange-600/40'
}

// ── Helper: pick a display colour based on the Python type name ──────────────
/**
 * Each Python type gets its own accent colour so variables are
 * immediately distinguishable by type at a glance.
 */
function typeColour(typeName) {
  switch (typeName) {
    case 'int':      return 'text-sky-300     bg-sky-900/30     border-sky-600/40'
    case 'float':    return 'text-cyan-300    bg-cyan-900/30    border-cyan-600/40'
    case 'str':      return 'text-orange-300  bg-orange-900/30  border-orange-600/40'
    case 'bool':     return 'text-indigo-300  bg-indigo-900/30  border-indigo-600/40'
    case 'list':     return 'text-yellow-300  bg-yellow-900/30  border-yellow-600/40'
    case 'dict':     return 'text-purple-300  bg-purple-900/30  border-purple-600/40'
    case 'set':      return 'text-pink-300    bg-pink-900/30    border-pink-600/40'
    case 'tuple':    return 'text-lime-300    bg-lime-900/30    border-lime-600/40'
    case 'NoneType': return 'text-slate-400   bg-slate-800/50   border-slate-600/40'
    default:         return 'text-gray-300    bg-gray-800/50    border-gray-600/40'
  }
}

// ── Helper: value display colour (for the large value text) ─────────────────
function valueColor(typeName) {
  switch (typeName) {
    case 'int':
    case 'float':    return 'text-vs-number'
    case 'str':      return 'text-vs-orange'
    case 'bool':     return 'text-[#569cd6]'
    case 'list':
    case 'tuple':
    case 'set':      return 'text-vs-yellow'
    default:         return 'text-vs-text'
  }
}

// ── Helper: stringify a value for display ───────────────────────────────────
function displayValue(v) {
  if (v === null || v === undefined) return 'None'
  if (typeof v === 'string') return `"${v}"`
  if (Array.isArray(v))      return `[${v.slice(0, 6).map(displayValue).join(', ')}${v.length > 6 ? ', …' : ''}]`
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// ── MemoryBox ─────────────────────────────────────────────────────────────────
/**
 * A single animated variable card.
 *
 * Props:
 *   name       — variable name (string)
 *   entry      — { value, size_bytes, type }
 *   isNew      — true if the variable appeared for the first time this step
 *   isChanged  — true if the variable's value changed this step
 */
function MemoryBox({ name, entry, isNew, isChanged }) {
  // Gracefully handle the old flat-value format from a cached run
  const value      = entry?.value      ?? entry
  const sizeBytes  = entry?.size_bytes ?? null
  const typeName   = entry?.type       ?? (Array.isArray(value) ? 'list' : typeof value)

  // Card border highlights green for new, blue for updated
  const borderClass = isNew
    ? 'border-emerald-500/60 shadow-[0_2px_12px_rgba(0,0,0,0.5)]'
    : isChanged
    ? 'border-sky-500/60 shadow-[0_2px_12px_rgba(0,0,0,0.5)]'
    : 'border-slate-700/80'

  // NEW / UPDATED badge shown in the top-left corner
  const statusBadge = isNew ? (
    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/30
                     border border-emerald-500/40 rounded px-1.5 py-0.5">
      NEW
    </span>
  ) : isChanged ? (
    <span className="text-[10px] font-bold text-sky-300 bg-sky-900/30
                     border border-sky-500/40 rounded px-1.5 py-0.5">
      UPDATED
    </span>
  ) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: -16 }}
      animate={{ opacity: 1, scale: 1,    y: 0   }}
      exit={{ opacity: 0,    scale: 0.75, y: 10  }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={`bg-slate-900/80 border ${borderClass} rounded-2xl p-3.5 mb-2.5 backdrop-blur-xl`}
    >
      {/* ── Row 1: status badge  ·  type pill  ·  memory size ── */}
      <div className="flex items-center justify-between mb-2.5 gap-2">

        {/* Left: NEW / UPDATED badge (or empty spacer) */}
        <div className="min-w-[3rem]">{statusBadge}</div>

        {/* Right: type + memory size */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">

          {/* Python type badge — colour-coded by type */}
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5
                            rounded-full border ${typeColour(typeName)}`}>
            {typeName}
          </span>

          {/* Memory allocation badge — colour-coded by size */}
          {sizeBytes !== null && (
            <span
              title={`sys.getsizeof() = ${sizeBytes} bytes (shallow CPython allocation)`}
              className={`text-[10px] font-mono font-semibold px-2 py-0.5
                          rounded-full border ${sizeColour(sizeBytes)}`}
            >
              {formatBytes(sizeBytes)}
            </span>
          )}
        </div>
      </div>

      {/* ── Row 2: variable name  ←→  value ── */}
      <div className="flex items-center justify-between gap-4">

        {/* Variable name in VS Code blue */}
        <span className="text-vs-blue font-mono font-semibold text-sm tracking-wide shrink-0">
          {name}
        </span>

        {/* Value — animates with a scale pop when it changes */}
        <motion.span
          key={displayValue(value)}
          className={`font-mono font-bold text-lg truncate max-w-[60%] ${valueColor(typeName)}`}
          initial={isChanged ? { scale: 1.35 } : {}}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          title={displayValue(value)}
        >
          {displayValue(value)}
        </motion.span>
      </div>

      {/* ── Row 3: address bar — simulates a memory address for educational effect ── */}
      <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between">
        <span className="text-[10px] text-slate-600 font-mono">
          addr: 0x{Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0xbabe) * 4).toString(16).padStart(4, '0').toUpperCase()}
        </span>
        <span className="text-[10px] text-slate-600 font-mono">
          {sizeBytes !== null ? `${sizeBytes} bytes allocated` : ''}
        </span>
      </div>
    </motion.div>
  )
}

// ── MemoryDiagram ─────────────────────────────────────────────────────────────
/**
 * Compact reference diagram shown at the bottom of the panel.
 * Displays each variable as a box → arrow → label for a CS textbook feel.
 */
function MemoryDiagram({ entries }) {
  if (entries.length === 0) return null
  return (
    <div className="border-t border-vs-border px-3 py-3 shrink-0">
      <div className="text-xs text-gray-500 mb-3 font-mono tracking-widest uppercase">
        Memory Diagram
      </div>
      <div className="flex gap-4 flex-wrap">
        {entries.map(([name, entry]) => {
          const value    = entry?.value ?? entry
          const typeName = entry?.type  ?? typeof value
          return (
            <div key={name} className="flex flex-col items-center gap-1">
              {/* Value box */}
              <div className="bg-vs-blue/15 border border-vs-blue/40 rounded-md
                              px-3 py-1 text-xs font-mono text-white min-w-12 text-center">
                {displayValue(value)}
              </div>
              {/* Downward arrow */}
              <div className="w-px h-4 bg-vs-border" />
              {/* Variable name */}
              <div className="bg-vs-surface border border-vs-border rounded-md
                              px-2 py-0.5 text-xs font-mono text-vs-yellow">
                {name}
              </div>
              {/* Type label */}
              <div className={`text-[9px] font-mono px-1.5 py-0.5 rounded border
                               ${typeColour(typeName)}`}>
                {typeName}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MemoryView({ memory, prevMemory }) {
  const entries     = Object.entries(memory     ?? {})
  const prevEntries = prevMemory ?? {}

  // Total memory in use — sum of all shallow sizes
  const totalBytes = entries.reduce((sum, [, entry]) => {
    return sum + (entry?.size_bytes ?? 0)
  }, 0)

  return (
    <div className="h-full flex flex-col">

      {/* Panel header */}
      <div className="panel-header">
        <span>Memory State</span>
        <div className="flex items-center gap-2">
          {/* Variable count */}
          <span className="text-gray-500 text-[10px] font-mono">
            {entries.length} var{entries.length !== 1 ? 's' : ''}
          </span>
          {/* Total memory usage across all variables */}
          {entries.length > 0 && (
            <span
              title="Total shallow sys.getsizeof() across all variables"
              className="text-slate-400 text-[10px] font-mono bg-slate-800/70
                         border border-slate-700/60 px-2 py-0.5 rounded-full"
            >
              {formatBytes(totalBytes)} total
            </span>
          )}
        </div>
      </div>

      {/* Variable cards */}
      <div className="flex-1 overflow-auto px-3 pt-3 pb-1 min-h-0">
        {entries.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">Memory is empty</p>
              <p className="text-gray-600 text-xs mt-1">
                Variables will appear here as code runs
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map(([name, entry]) => {
              // Compare serialized values to detect changes between steps
              const prevEntry  = prevEntries[name]
              const isNew      = !(name in prevEntries)
              const isChanged  = !isNew &&
                JSON.stringify(prevEntry?.value ?? prevEntry) !==
                JSON.stringify(entry?.value    ?? entry)

              return (
                <MemoryBox
                  key={name}
                  name={name}
                  entry={entry}
                  isNew={isNew}
                  isChanged={isChanged}
                />
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Reference diagram at the bottom */}
      <MemoryDiagram entries={entries} />
    </div>
  )
}
