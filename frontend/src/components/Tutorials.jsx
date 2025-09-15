import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import { fetchTutorials } from '../api'

/* ─── DifficultyBadge ─────────────────────────────────────── */
function DifficultyBadge({ level }) {
  const cls = level === 'Beginner'
    ? 'text-green-400 bg-green-900/20 border-green-700/50'
    : 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50'
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${cls}`}>
      {level}
    </span>
  )
}

/* ─── TutorialCard ────────────────────────────────────────── */
function TutorialCard({ tut, onExpand, isExpanded, onRun }) {
  const id = tut._id

  return (
    <motion.div
      className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden
                 hover:border-[#374151] transition-all duration-200"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tut.icon || '💡'}</span>
            <div>
              <h3 className="text-white font-semibold">{tut.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <DifficultyBadge level={tut.level} />
                <span className="text-xs text-gray-500 font-mono">{tut.topic}</span>
                <span className="text-xs text-gray-500 font-mono">⏱ {tut.time}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{tut.description}</p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRun(tut)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                       text-white rounded-lg text-sm font-semibold transition-colors duration-150"
          >
            ▶ Run in Visualizer
          </button>
          <button
            onClick={() => onExpand(id)}
            className="px-3 py-2 bg-transparent border border-[#374151] hover:border-gray-500
                       text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
          >
            {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1F2937] p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Explanation */}
              <div>
                <h4 className="text-xs text-blue-400 font-mono tracking-widest mb-3">
                  STEP-BY-STEP EXPLANATION
                </h4>
                <ol className="space-y-2">
                  {(tut.explanation || []).map((step, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-300">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 text-blue-400
                                       text-xs flex items-center justify-center font-mono mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Code + expected output */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs text-green-400 font-mono tracking-widest mb-2">CODE</h4>
                  <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-4">
                    <pre className="text-gray-200 font-mono text-sm leading-relaxed">
                      {tut.code}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs text-yellow-400 font-mono tracking-widest mb-2">
                    EXPECTED OUTPUT
                  </h4>
                  <div className="bg-[#0d1117] border border-[#1F2937] rounded-lg p-3">
                    <pre className="text-green-400 font-mono text-sm">{tut.output}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => onRun(tut)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500
                           text-white rounded-lg font-semibold flex items-center justify-center gap-2
                           transition-colors duration-150"
              >
                ▶ Open in CodeVision Visualizer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Skeleton loader ───────────────────────────────────────── */
function SkeletonTutorial() {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-[#1F2937] rounded" />
        <div>
          <div className="h-4 bg-[#1F2937] rounded w-40 mb-2" />
          <div className="h-3 bg-[#1F2937] rounded w-24" />
        </div>
      </div>
      <div className="h-3 bg-[#1F2937] rounded w-full mb-1" />
      <div className="h-3 bg-[#1F2937] rounded w-5/6" />
    </div>
  )
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function Tutorials() {
  const navigate = useNavigate()
  const [tutorials, setTutorials] = useState([])
  const [expanded,  setExpanded]  = useState(null)
  const [topic,     setTopic]     = useState('All')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    fetchTutorials()
      .then(({ data }) => setTutorials(data))
      .catch(() => setError('Failed to load tutorials. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id) => setExpanded(prev => (prev === id ? null : id))

  const runInVisualizer = (tut) => {
    navigate('/visualizer', { state: { code: tut.code } })
  }

  // Build topic filter options from loaded data
  const topics = ['All', ...new Set(tutorials.map(t => t.topic).filter(Boolean))]

  const visible = topic === 'All'
    ? tutorials
    : tutorials.filter(t => t.topic === topic)

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E5E7EB]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Page header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-violet-900/20 border border-violet-700/40 text-violet-400 text-sm mb-5">
            <span>🚀</span> Interactive Tutorials
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Learn by <span className="text-violet-400">Doing</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Each tutorial includes step-by-step explanations.
            Click <span className="text-blue-400">▶ Run in Visualizer</span> to see the code
            execute live in CodeVision.
          </p>
        </motion.div>

        {/* Topic filter */}
        {!loading && !error && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {topics.map(cat => (
              <button
                key={cat}
                onClick={() => setTopic(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
                  topic === cat
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-transparent border border-[#374151] text-gray-400 hover:text-white hover:bg-[#1F2937]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        {!loading && !error && (
          <div className="flex justify-center gap-8 mb-8 text-center">
            {[
              { label: 'Tutorials',   value: visible.length },
              { label: 'Beginner',    value: visible.filter(t => t.level === 'Beginner').length },
              { label: 'Interactive', value: visible.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-red-400 text-sm">
            <div className="text-4xl mb-3">⚠</div>
            <p>{error}</p>
          </div>
        )}

        {/* Tutorial list */}
        <div className="space-y-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonTutorial key={i} />)
            : visible.map(tut => (
                <TutorialCard
                  key={tut._id}
                  tut={tut}
                  isExpanded={expanded === tut._id}
                  onExpand={toggle}
                  onRun={runInVisualizer}
                />
              ))
          }
        </div>

        {/* Bottom CTA */}
        {!loading && (
          <motion.div
            className="mt-12 text-center bg-[#111827] border border-[#1F2937] rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-bold text-white mb-2">
              Ready to visualize your own code?
            </h3>
            <p className="text-gray-400 text-sm mb-5">
              Open the CodeVision Visualizer and type any Python code to see it run.
            </p>
            <button
              onClick={() => navigate('/visualizer')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg
                         font-semibold transition-colors duration-150"
            >
              Open Visualizer →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
