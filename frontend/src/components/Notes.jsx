import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import { fetchNotes } from '../api'

/* ─── Category badge color map ──────────────────────────────── */
const CATEGORY_COLORS = {
  'Fundamentals':  'text-blue-400 bg-blue-900/20 border-blue-700/50',
  'Control Flow':  'text-yellow-400 bg-yellow-900/20 border-yellow-700/50',
  'Modular Code':  'text-green-400 bg-green-900/20 border-green-700/50',
  'Collections':   'text-orange-400 bg-orange-900/20 border-orange-700/50',
}
const getCategoryColor = (cat) =>
  CATEGORY_COLORS[cat] || 'text-gray-400 bg-[#1F2937] border-[#374151]'

/* ─── NoteCard ─────────────────────────────────────────────── */
function NoteCard({ note, isOpen, onToggle }) {
  return (
    <motion.div
      className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden
                 hover:border-[#374151] transition-all duration-200"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <span className="text-3xl shrink-0">{note.icon || '📄'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-white font-semibold">{note.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono
                              ${getCategoryColor(note.category)}`}>
              {note.category}
            </span>
          </div>
          <p className="text-gray-400 text-sm truncate">{note.summary}</p>
        </div>
        <motion.span
          className="text-gray-500 shrink-0"
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▶
        </motion.span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1F2937] p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Explanation */}
              <div>
                <h3 className="text-blue-400 text-xs font-mono tracking-widest mb-3">EXPLANATION</h3>
                <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                  {note.content?.trim()}
                </pre>
              </div>

              {/* Code example */}
              <div>
                <h3 className="text-green-400 text-xs font-mono tracking-widest mb-3">CODE EXAMPLE</h3>
                <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-4">
                  <pre className="text-gray-200 font-mono text-sm leading-relaxed">
                    {note.codeExample}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Skeleton loader ───────────────────────────────────────── */
function SkeletonNote() {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-[#1F2937] rounded" />
        <div className="flex-1">
          <div className="h-4 bg-[#1F2937] rounded w-1/3 mb-2" />
          <div className="h-3 bg-[#1F2937] rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function Notes() {
  const [notes,   setNotes]   = useState([])
  const [openId,  setOpenId]  = useState(null)
  const [filter,  setFilter]  = useState('All')
  const [search,  setSearch]  = useState('')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Fetch all notes on mount; search/filter applied client-side
  useEffect(() => {
    fetchNotes()
      .then(({ data }) => setNotes(data))
      .catch(() => setError('Failed to load notes. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id) => setOpenId(prev => (prev === id ? null : id))

  // Build category filter options from loaded data
  const categories = ['All', ...new Set(notes.map(n => n.category).filter(Boolean))]

  const visible = notes.filter(n => {
    const matchCat    = filter === 'All' || n.category === filter
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.summary || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen bg-vs-bg text-vs-text">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Page header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-green-900/20 border border-green-700/40 text-green-400 text-sm mb-5">
            <span>📝</span> Quick Reference
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Concept <span className="text-green-400">Notes</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Clear, concise explanations of core programming concepts.
            Click any card to expand the full explanation and code example.
          </p>
        </motion.div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-[#111827] border border-[#374151] rounded-lg px-4 py-2
                       text-sm text-gray-200 placeholder-gray-600 focus:outline-none
                       focus:border-blue-600 transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  filter === t
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-transparent border border-[#374151] text-gray-400 hover:text-white hover:bg-[#1F2937]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-12 text-red-400 text-sm">
            <div className="text-4xl mb-3">⚠</div>
            <p>{error}</p>
          </div>
        )}

        {/* Notes list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonNote key={i} />)}
          </div>
        ) : visible.length > 0 ? (
          <div className="space-y-3">
            {visible.map(note => (
              <NoteCard
                key={note._id}
                note={note}
                isOpen={openId === note._id}
                onToggle={() => toggle(note._id)}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p>No notes match your search.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
