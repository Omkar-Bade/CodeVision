/**
 * MemoryView.jsx
 *
 * Renders the "Memory State" panel — an animated grid of variable cards
 * showing the name, value, Python type, and memory allocation for each
 * variable at the current execution step.
 *
 * Now also shows:
 *   - Call stack visualization when functions are active
 *   - Scope label (global / function name) per variable group
 *
 * Data shape received from the backend (per variable):
 *   memory = {
 *     "a": { value: 5,       size_bytes: 28,  type: "int"  },
 *     "b": { value: "hello", size_bytes: 54,  type: "str"  },
 *   }
 */

import { motion, AnimatePresence } from 'framer-motion'

// ── Helpers ────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '? B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

function sizeColour(bytes) {
  if (!bytes) return 'text-gray-500 bg-transparent border-[#374151]'
  if (bytes < 100)  return 'text-green-400  bg-green-900/20  border-green-700/50'
  if (bytes < 500)  return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50'
  return                   'text-orange-400 bg-orange-900/20 border-orange-700/50'
}

function typeColour(typeName) {
  switch (typeName) {
    case 'int':      return 'text-blue-400   bg-blue-900/20   border-blue-700/50'
    case 'float':    return 'text-cyan-400   bg-cyan-900/20   border-cyan-700/50'
    case 'str':      return 'text-orange-400 bg-orange-900/20 border-orange-700/50'
    case 'bool':     return 'text-violet-400 bg-violet-900/20 border-violet-700/50'
    case 'list':     return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50'
    case 'dict':     return 'text-purple-400 bg-purple-900/20 border-purple-700/50'
    case 'set':      return 'text-pink-400   bg-pink-900/20   border-pink-700/50'
    case 'tuple':    return 'text-lime-400   bg-lime-900/20   border-lime-700/50'
    case 'NoneType': return 'text-gray-500   bg-transparent   border-[#374151]'
    default:         return 'text-gray-400   bg-transparent   border-[#374151]'
  }
}

function valueColor(typeName) {
  switch (typeName) {
    case 'int':
    case 'float':    return 'text-blue-300'
    case 'str':      return 'text-orange-300'
    case 'bool':     return 'text-violet-300'
    case 'list':
    case 'tuple':
    case 'set':      return 'text-yellow-300'
    default:         return 'text-gray-200'
  }
}

function displayValue(v) {
  if (v === null || v === undefined) return 'None'
  if (typeof v === 'string') return `"${v}"`
  if (Array.isArray(v))      return `[${v.slice(0, 6).map(displayValue).join(', ')}${v.length > 6 ? ', …' : ''}]`
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// ── CallStack visualization ─────────────────────────────────────

function CallStack({ callStack }) {
  if (!callStack || callStack.length === 0) return null

  return (
    <div className="mx-3 mb-2">
      <div className="text-[10px] text-gray-500 font-mono tracking-widest mb-1.5">
        CALL STACK
      </div>
      <div className="flex flex-col gap-1">
        {[...callStack].reverse().map((frame, i) => {
          const varCount = Object.keys(frame.locals ?? {}).length
          return (
            <motion.div
              key={`${frame.name}-${i}`}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-mono
                ${i === 0
                  ? 'bg-blue-900/20 border-blue-700/40 text-blue-300'
                  : 'bg-[#0B1120] border-[#1F2937] text-gray-400'
                }`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${i === 0 ? 'text-blue-400' : 'text-gray-600'}`}>
                  {i === 0 ? '▶' : '│'}
                </span>
                <span className="font-semibold">{frame.name}()</span>
              </div>
              <span className="text-[10px] text-gray-500">
                {varCount} var{varCount !== 1 ? 's' : ''}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── MemoryBox ─────────────────────────────────────────────────────

function MemoryBox({ name, entry, isNew, isChanged }) {
  const value      = entry?.value      ?? entry
  const sizeBytes  = entry?.size_bytes ?? null
  const typeName   = entry?.type       ?? (Array.isArray(value) ? 'list' : typeof value)

  const borderClass = isNew
    ? 'border-green-700/70'
    : isChanged
    ? 'border-blue-600/60'
    : 'border-[#1F2937]'

  const statusBadge = isNew ? (
    <span className="text-[10px] font-bold text-green-400 bg-green-900/25
                     border border-green-700/50 rounded px-1.5 py-0.5">
      NEW
    </span>
  ) : isChanged ? (
    <span className="text-[10px] font-bold text-blue-400 bg-blue-900/25
                     border border-blue-700/50 rounded px-1.5 py-0.5">
      UPDATED
    </span>
  ) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -12 }}
      animate={{ opacity: 1, scale: 1,   y: 0   }}
      exit={{ opacity: 0,   scale: 0.85, y: 8   }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={`bg-[#111827] border ${borderClass} rounded-xl p-3.5 mb-2.5`}
    >
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <div className="min-w-[3rem]">{statusBadge}</div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5
                            rounded-full border ${typeColour(typeName)}`}>
            {typeName}
          </span>
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

      <div className="flex items-center justify-between gap-4">
        <span className="text-blue-400 font-mono font-semibold text-sm tracking-wide shrink-0">
          {name}
        </span>
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

      <div className="mt-2 pt-2 border-t border-[#1F2937] flex items-center justify-between">
        <span className="text-[10px] text-gray-600 font-mono">
          addr: 0x{Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0xbabe) * 4).toString(16).padStart(4, '0').toUpperCase()}
        </span>
        <span className="text-[10px] text-gray-600 font-mono">
          {sizeBytes !== null ? `${sizeBytes} bytes allocated` : ''}
        </span>
      </div>
    </motion.div>
  )
}

// ── MemoryDiagram ──────────────────────────────────────────────────

function MemoryDiagram({ entries }) {
  if (entries.length === 0) return null
  return (
    <div className="border-t border-[#1F2937] px-3 py-3 shrink-0">
      <div className="text-[10px] text-gray-500 mb-3 font-mono tracking-widest uppercase">
        Memory Diagram
      </div>
      <div className="flex gap-4 flex-wrap">
        {entries.map(([name, entry]) => {
          const value    = entry?.value ?? entry
          const typeName = entry?.type  ?? typeof value
          return (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className="bg-blue-600/15 border border-blue-600/40 rounded
                              px-3 py-1 text-xs font-mono text-white min-w-12 text-center">
                {displayValue(value)}
              </div>
              <div className="w-px h-3 bg-[#374151]" />
              <div className="bg-[#0B1120] border border-[#374151] rounded
                              px-2 py-0.5 text-xs font-mono text-yellow-300">
                {name}
              </div>
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

// ── Main Component ─────────────────────────────────────────────────

export default function MemoryView({ memory, prevMemory, callStack, scope }) {
  const entries     = Object.entries(memory     ?? {})
  const prevEntries = prevMemory ?? {}

  const totalBytes = entries.reduce((sum, [, entry]) => {
    return sum + (entry?.size_bytes ?? 0)
  }, 0)

  const scopeLabel = scope && scope !== 'global'
    ? `${scope}() — local`
    : 'Global Memory'

  return (
    <div className="h-full flex flex-col">
      {/* Panel header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span>Memory State</span>
          {scope && scope !== 'global' && (
            <span className="text-[10px] font-mono text-blue-400 bg-blue-900/20
                             border border-blue-700/50 rounded px-1.5 py-0.5">
              {scope}()
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-[10px] font-mono">
            {entries.length} var{entries.length !== 1 ? 's' : ''}
          </span>
          {entries.length > 0 && (
            <span
              title="Total shallow sys.getsizeof() across all variables"
              className="text-gray-400 text-[10px] font-mono bg-[#1F2937]
                         border border-[#374151] px-2 py-0.5 rounded-full"
            >
              {formatBytes(totalBytes)} total
            </span>
          )}
        </div>
      </div>

      {/* Call stack (shown when functions are active) */}
      <CallStack callStack={callStack} />

      {/* Scope label */}
      {entries.length > 0 && (
        <div className="mx-3 mb-1">
          <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
            {scopeLabel}
          </span>
        </div>
      )}

      {/* Variable cards */}
      <div className="flex-1 overflow-auto px-3 pt-1 pb-1 min-h-0">
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
