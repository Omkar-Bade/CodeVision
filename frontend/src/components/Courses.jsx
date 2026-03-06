import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import { fetchCourses } from '../api'

/* ─── Level Badge ────────────────────────────────────────── */
function LevelBadge({ level }) {
  const color = level === 'Beginner'
    ? 'text-green-400 bg-green-900/20 border-green-700/50'
    : 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50'
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${color}`}>
      {level}
    </span>
  )
}

/* ─── Course Card ─────────────────────────────────────────── */
function CourseCard({ course, onOpen }) {
  return (
    <motion.div
      className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 flex flex-col
                 hover:border-[#374151] hover:-translate-y-1 transition-all duration-200
                 cursor-pointer group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => onOpen(course)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl">{course.icon || '📘'}</span>
        <LevelBadge level={course.level} />
      </div>
      <h3 className="text-white font-bold text-lg mb-2 font-sans">{course.title}</h3>
      <p className="text-gray-400 text-sm mb-4 flex-1 leading-relaxed">{course.description}</p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-gray-500 text-xs font-mono">⏱ {course.duration}</span>
        <span className="text-xs font-mono text-blue-400 group-hover:underline">
          Open Course →
        </span>
      </div>
    </motion.div>
  )
}

/* ─── Course Modal ─────────────────────────────────────────── */
function CourseModal({ course, onClose }) {
  if (!course) return null
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#111827] border border-[#1F2937] rounded-xl w-full max-w-2xl
                   max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#1F2937]">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{course.icon || '📘'}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{course.title}</h2>
                <LevelBadge level={course.level} />
              </div>
              <p className="text-gray-400 text-sm">{course.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl ml-4">✕</button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topics */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-blue-400">📖</span> Topics Covered
            </h3>
            <ul className="space-y-2">
              {(course.topics || []).map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Lessons */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-green-400">🎓</span> Lessons
            </h3>
            <div className="space-y-2">
              {(course.lessons || []).map((l, i) => (
                <div key={i}
                  className="flex items-center justify-between bg-[#0B1120] border border-[#1F2937]
                             rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs
                                     flex items-center justify-center font-mono">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-300">{l.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{l.mins} min</span>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center py-3 bg-[#0B1120] border border-[#1F2937] rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Total duration</p>
              <p className="text-white font-bold">{course.duration}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg
                       font-semibold transition-colors duration-150"
          >
            Start Learning (Coming Soon)
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Skeleton loader ──────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="w-10 h-10 bg-[#1F2937] rounded" />
        <div className="w-20 h-5 bg-[#1F2937] rounded-full" />
      </div>
      <div className="h-5 bg-[#1F2937] rounded mb-2 w-3/4" />
      <div className="h-4 bg-[#1F2937] rounded mb-1 w-full" />
      <div className="h-4 bg-[#1F2937] rounded mb-1 w-5/6" />
      <div className="h-4 bg-[#1F2937] rounded w-2/3" />
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function Courses() {
  const [courses,  setCourses]  = useState([])
  const [selected, setSelected] = useState(null)
  const [filter,   setFilter]   = useState('All')
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  // Fetch courses from the Node.js backend
  useEffect(() => {
    fetchCourses()
      .then(({ data }) => setCourses(data))
      .catch(() => setError('Failed to load courses. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const levels = ['All', 'Beginner', 'Intermediate']
  const filtered = filter === 'All' ? courses : courses.filter(c => c.level === filter)

  return (
    <div className="min-h-screen bg-vs-bg text-vs-text">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Page header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-blue-600/10 border border-blue-600/30 text-blue-400 text-sm mb-5">
            <span>🎓</span> Learning Path
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Python <span className="text-blue-400">Courses</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Structured courses designed to take you from zero to confident programmer.
            Learn at your own pace with hands-on examples.
          </p>
        </motion.div>

        {/* Filter */}
        <div className="flex justify-center gap-2 mb-10">
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
                filter === l
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'bg-transparent border border-[#374151] text-gray-400 hover:text-white hover:bg-[#1F2937]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-red-400 text-sm">
            <div className="text-4xl mb-3">⚠</div>
            <p>{error}</p>
          </div>
        )}

        {/* Grid */}
        {!error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : filtered.map(course => (
                  <CourseCard key={course._id} course={course} onOpen={setSelected} />
                ))
            }
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">📭</div>
            <p>No courses found for this filter.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && <CourseModal course={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
