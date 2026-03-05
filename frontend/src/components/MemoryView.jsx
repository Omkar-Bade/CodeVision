import { motion, AnimatePresence } from 'framer-motion'

/* ─── Helpers ─────────────────────────────────────────────── */
function typeLabel(v) {
  if (v === null || v === undefined) return 'None'
  if (Array.isArray(v)) return 'list'
  return typeof v
}

function displayValue(v) {
  if (v === null || v === undefined) return 'None'
  if (typeof v === 'string') return `"${v}"`
  if (Array.isArray(v)) return `[${v.map(displayValue).join(', ')}]`
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function valueColor(v) {
  if (typeof v === 'number')  return 'text-vs-number'
  if (typeof v === 'string')  return 'text-vs-orange'
  if (typeof v === 'boolean') return 'text-[#569cd6]'
  if (Array.isArray(v))       return 'text-vs-yellow'
  return 'text-vs-text'
}

/* ─── MemoryBox ────────────────────────────────────────────── */
function MemoryBox({ name, value, isNew, isChanged }) {
  const borderClass = isNew
    ? 'border-vs-green shadow-green-glow'
    : isChanged
    ? 'border-vs-blue shadow-blue-glow'
    : 'border-vs-border'

  const badge = isNew ? (
    <span className="text-[10px] font-bold text-vs-green bg-vs-green/10
                     border border-vs-green/30 rounded px-1.5 py-0.5">
      NEW
    </span>
  ) : isChanged ? (
    <span className="text-[10px] font-bold text-vs-blue bg-vs-blue/10
                     border border-vs-blue/30 rounded px-1.5 py-0.5">
      UPDATED
    </span>
  ) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: -16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.75, y: 10 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={`bg-vs-bg border ${borderClass} rounded-xl p-3 mb-2.5`}
    >
      {/* Top row: badge + type */}
      <div className="flex items-center justify-between mb-2">
        <div>{badge}</div>
        <span className="text-[10px] text-gray-500 font-mono bg-vs-surface
                         px-2 py-0.5 rounded-full">
          {typeLabel(value)}
        </span>
      </div>

      {/* Main row: name ← value */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-vs-yellow font-mono font-semibold text-base">
          {name}
        </span>
        <motion.span
          key={displayValue(value)}
          className={`font-mono font-bold text-lg ${valueColor(value)}`}
          initial={isChanged ? { scale: 1.35, color: '#007acc' } : {}}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {displayValue(value)}
        </motion.span>
      </div>
    </motion.div>
  )
}

/* ─── MemoryDiagram ────────────────────────────────────────── */
function MemoryDiagram({ entries }) {
  if (entries.length === 0) return null
  return (
    <div className="border-t border-vs-border px-3 py-3">
      <div className="text-xs text-gray-500 mb-3 font-mono tracking-widest">
        MEMORY DIAGRAM
      </div>
      <div className="flex gap-4 flex-wrap">
        {entries.map(([name, value]) => (
          <div key={name} className="flex flex-col items-center gap-1">
            {/* Value box */}
            <div className="bg-vs-blue/15 border border-vs-blue/40 rounded-md
                            px-3 py-1 text-xs font-mono text-white min-w-12 text-center">
              {displayValue(value)}
            </div>
            {/* Arrow */}
            <div className="w-px h-5 bg-vs-border" />
            {/* Variable name */}
            <div className="bg-vs-surface border border-vs-border rounded-md
                            px-2 py-0.5 text-xs font-mono text-vs-yellow">
              {name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────── */
export default function MemoryView({ memory, prevMemory }) {
  const entries     = Object.entries(memory ?? {})
  const prevEntries = prevMemory ?? {}

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="panel-header">
        <span>Memory State</span>
        <span className="text-gray-500">
          {entries.length} variable{entries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Variable boxes */}
      <div className="flex-1 overflow-auto px-3 pt-3 pb-1">
        {entries.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">Memory is empty</p>
              <p className="text-gray-600 text-xs mt-1">Variables will appear here as code runs</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map(([name, value]) => {
              const isNew     = !(name in prevEntries)
              const isChanged = !isNew &&
                JSON.stringify(prevEntries[name]) !== JSON.stringify(value)
              return (
                <MemoryBox
                  key={name}
                  name={name}
                  value={value}
                  isNew={isNew}
                  isChanged={isChanged}
                />
              )
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Diagram */}
      <MemoryDiagram entries={entries} />
    </div>
  )
}
