/**
 * ErrorExplanation.jsx
 *
 * Animated panel displayed below the Monaco editor whenever the Python
 * linter detects issues in the user's code.
 *
 * Design goals:
 *   - Beginner-friendly: each error card shows a plain-English explanation,
 *     a fix hint, and a short executable example so learners understand
 *     the mistake without reading dry documentation.
 *   - Non-overwhelming: at most 3 cards are rendered at once; a "+N more
 *     issues" label is shown when there are additional problems.
 *   - Smooth: the panel slides in/out with a height animation so it doesn't
 *     cause a jarring layout shift.
 *
 * Sub-components:
 *   ExplanationCard — renders a single error's icon, type badge, line
 *                     number, description, 💡 hint, and code example.
 *
 * Props:
 *   explanations — array of explanation objects produced by `explainErrors()`
 *                  in lib/errorExplainer.js.  Each object has:
 *                  { type, title, explanation, hint, example, line }
 *
 * Text formatting:
 *   `renderBold` converts **bold** markdown syntax to <strong> elements
 *   so explanation text can highlight key terms without extra libraries.
 */
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_STYLES = {
  SyntaxError: { icon: '🔴', color: 'text-red-400', border: 'border-red-800/40', bg: 'bg-red-950/30' },
  IndentationError: { icon: '🟡', color: 'text-yellow-400', border: 'border-yellow-800/40', bg: 'bg-yellow-950/30' },
  NameError: { icon: '🔴', color: 'text-red-400', border: 'border-red-800/40', bg: 'bg-red-950/30' },
  Typo: { icon: '🟠', color: 'text-amber-400', border: 'border-amber-800/40', bg: 'bg-amber-950/30' },
}
const DEFAULT_STYLE = { icon: '⚠', color: 'text-gray-400', border: 'border-[#374151]', bg: 'bg-[#0d1117]' }

function renderBold(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
      : part
  )
}

function ExplanationCard({ exp, isLast }) {
  const style = TYPE_STYLES[exp.type] ?? DEFAULT_STYLE

  return (
    <motion.div
      className={`${style.bg} border ${style.border} rounded-lg overflow-hidden
                  ${isLast ? '' : 'mb-2'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1F2937]/60">
        <span className="text-sm">{style.icon}</span>
        <span className={`text-xs font-bold font-mono ${style.color}`}>{exp.type}</span>
        <span className="text-gray-500 text-[10px] font-mono">line {exp.line}</span>
        <span className="text-gray-300 text-xs font-medium ml-1">{exp.title}</span>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Explanation */}
        <p className="text-gray-300 text-xs leading-relaxed">
          {renderBold(exp.explanation)}
        </p>

        {/* Hint */}
        <div className="flex items-start gap-2">
          <span className="text-blue-400 text-xs mt-px shrink-0">💡</span>
          <p className="text-blue-300 text-xs leading-relaxed">
            {renderBold(exp.hint)}
          </p>
        </div>

        {/* Example fix */}
        <div>
          <span className="text-[10px] font-mono text-green-500 tracking-wider">EXAMPLE FIX</span>
          <pre className="mt-1 bg-[#0B1120] border border-[#1F2937] rounded-md px-3 py-2
                          text-green-400 text-xs font-mono leading-relaxed overflow-x-auto">
            {exp.example}
          </pre>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Panel that displays beginner-friendly error explanations.
 * Shows at most 3 explanations to avoid overwhelming the user.
 */
export default function ErrorExplanation({ explanations = [] }) {
  const visible = explanations.slice(0, 3)
  const hasMore = explanations.length > 3

  return (
    <AnimatePresence mode="sync">
      {visible.length > 0 && (
        <motion.div
          key="error-panel"
          className="border-t border-[#1F2937] bg-[#111827] overflow-y-auto"
          style={{ maxHeight: '45%' }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-between px-3 py-1.5
                          bg-[#111827] border-b border-[#1F2937] select-none">
            <div className="flex items-center gap-2">
              <span className="text-xs">🎓</span>
              <span className="text-[11px] font-mono text-gray-400">Error Explanation</span>
            </div>
            <span className="text-[10px] font-mono text-gray-600">
              {explanations.length} {explanations.length === 1 ? 'issue' : 'issues'}
            </span>
          </div>

          <div className="p-2">
            {visible.map((exp, i) => (
              <ExplanationCard
                key={`${exp.type}-${exp.title}-${exp.line}`}
                exp={exp}
                isLast={i === visible.length - 1}
              />
            ))}
            {hasMore && (
              <p className="text-center text-[10px] text-gray-600 font-mono mt-1">
                +{explanations.length - 3} more {explanations.length - 3 === 1 ? 'issue' : 'issues'}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
