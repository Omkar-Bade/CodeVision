import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'

const COURSES = [
  {
    id: 1,
    icon: '🐍',
    title: 'Python Basics',
    level: 'Beginner',
    duration: '2 hrs',
    color: 'vs-blue',
    border: 'border-vs-blue',
    desc: 'Start your Python journey with fundamental concepts, syntax, and your very first program.',
    topics: [
      'What is Python and why use it?',
      'Installing Python and setting up your environment',
      'Writing your first "Hello, World!" program',
      'Understanding indentation and code blocks',
      'Comments: single-line and multi-line',
      'Using the Python REPL interactively',
    ],
    lessons: [
      { title: 'Introduction to Python',     mins: 12 },
      { title: 'Your First Program',          mins: 8  },
      { title: 'Understanding Syntax',        mins: 10 },
      { title: 'Working with the REPL',       mins: 7  },
    ],
  },
  {
    id: 2,
    icon: '📦',
    title: 'Variables & Data Types',
    level: 'Beginner',
    duration: '1.5 hrs',
    color: 'vs-green',
    border: 'border-vs-green',
    desc: 'Understand how Python stores information — integers, floats, strings, booleans, and more.',
    topics: [
      'What is a variable? Naming rules',
      'int, float, str, bool data types',
      'Type checking with type()',
      'Type conversion: int(), str(), float()',
      'Multiple assignment in one line',
      'Constants and best practices',
    ],
    lessons: [
      { title: 'Variables Explained',         mins: 10 },
      { title: 'Numeric Types',               mins: 9  },
      { title: 'Strings & Booleans',          mins: 11 },
      { title: 'Type Conversion',             mins: 8  },
    ],
  },
  {
    id: 3,
    icon: '🔄',
    title: 'Loops',
    level: 'Beginner',
    duration: '2 hrs',
    color: 'vs-yellow',
    border: 'border-vs-yellow',
    desc: 'Master iteration — repeat actions with for loops, while loops, and loop control statements.',
    topics: [
      'for loop with range()',
      'Iterating over lists and strings',
      'while loop and condition-based looping',
      'break, continue, and pass',
      'Nested loops',
      'Loop patterns: sum, count, accumulate',
    ],
    lessons: [
      { title: 'The for Loop',                mins: 12 },
      { title: 'The while Loop',              mins: 10 },
      { title: 'Loop Control Statements',     mins: 9  },
      { title: 'Nested Loops',                mins: 11 },
    ],
  },
  {
    id: 4,
    icon: '🔀',
    title: 'Conditional Statements',
    level: 'Beginner',
    duration: '1.5 hrs',
    color: 'vs-purple',
    border: 'border-vs-purple',
    desc: 'Make your programs smart — use if, elif, else to control the flow of execution.',
    topics: [
      'Boolean expressions and comparisons',
      'if / else statements',
      'elif chains',
      'Nested conditionals',
      'Ternary (one-line) if expressions',
      'Logical operators: and, or, not',
    ],
    lessons: [
      { title: 'Boolean Logic',               mins: 8  },
      { title: 'if and else',                 mins: 10 },
      { title: 'elif Chains',                 mins: 9  },
      { title: 'Nested & Ternary',            mins: 8  },
    ],
  },
  {
    id: 5,
    icon: '📋',
    title: 'Lists & Collections',
    level: 'Intermediate',
    duration: '2.5 hrs',
    color: 'vs-orange',
    border: 'border-vs-orange',
    desc: 'Work with groups of data using lists, tuples, dictionaries, and sets.',
    topics: [
      'Creating and indexing lists',
      'List methods: append, remove, sort',
      'List slicing and comprehensions',
      'Tuples vs lists',
      'Dictionaries: key-value storage',
      'Sets: unique collections',
    ],
    lessons: [
      { title: 'Lists Deep Dive',             mins: 15 },
      { title: 'Tuples',                      mins: 8  },
      { title: 'Dictionaries',                mins: 14 },
      { title: 'Sets',                        mins: 8  },
    ],
  },
  {
    id: 6,
    icon: '⚙️',
    title: 'Functions',
    level: 'Intermediate',
    duration: '2 hrs',
    color: 'vs-blue',
    border: 'border-vs-blue',
    desc: 'Learn to write reusable, modular code using functions, parameters, and return values.',
    topics: [
      'Defining functions with def',
      'Parameters and arguments',
      'Return values',
      'Default and keyword arguments',
      'Scope: local vs global variables',
      'Lambda functions',
    ],
    lessons: [
      { title: 'Defining Functions',          mins: 12 },
      { title: 'Parameters & Returns',        mins: 11 },
      { title: 'Scope',                       mins: 10 },
      { title: 'Lambda & Advanced',           mins: 9  },
    ],
  },
]

/* ─── Level Badge ────────────────────────────────────────── */
function LevelBadge({ level }) {
  const color = level === 'Beginner' ? 'text-vs-green bg-vs-green/10 border-vs-green/30'
                                     : 'text-vs-yellow bg-vs-yellow/10 border-vs-yellow/30'
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
      className={`bg-vs-surface border ${course.border}/30 rounded-xl p-5 flex flex-col
                  hover:border-opacity-80 hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.01 }}
      onClick={() => onOpen(course)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl">{course.icon}</span>
        <LevelBadge level={course.level} />
      </div>
      <h3 className="text-white font-bold text-lg mb-2 font-sans">{course.title}</h3>
      <p className="text-gray-400 text-sm mb-4 flex-1 leading-relaxed">{course.desc}</p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-gray-500 text-xs font-mono">⏱ {course.duration}</span>
        <span className={`text-xs font-mono text-${course.color} group-hover:underline`}>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-vs-surface border border-vs-border rounded-2xl w-full max-w-2xl
                   max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-vs-border">
          <div className="flex items-center gap-4">
            <span className="text-5xl">{course.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{course.title}</h2>
                <LevelBadge level={course.level} />
              </div>
              <p className="text-gray-400 text-sm">{course.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl ml-4">✕</button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topics */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-vs-blue">📖</span> Topics Covered
            </h3>
            <ul className="space-y-2">
              {course.topics.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-vs-green mt-0.5 shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Lessons */}
          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="text-vs-green">🎓</span> Lessons
            </h3>
            <div className="space-y-2">
              {course.lessons.map((l, i) => (
                <div key={i}
                  className="flex items-center justify-between bg-vs-bg border border-vs-border
                             rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-vs-blue/20 text-vs-blue text-xs
                                     flex items-center justify-center font-mono">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-300">{l.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{l.mins} min</span>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center py-3 bg-vs-bg border border-vs-border rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Total duration</p>
              <p className="text-white font-bold">{course.duration}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-vs-blue hover:bg-blue-500 text-white rounded-lg
                       font-semibold transition-colors duration-200"
          >
            Start Learning (Coming Soon)
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Page ────────────────────────────────────────────────── */
export default function Courses() {
  const [selected, setSelected] = useState(null)
  const [filter,   setFilter]   = useState('All')

  const levels = ['All', 'Beginner', 'Intermediate']
  const filtered = filter === 'All' ? COURSES : COURSES.filter(c => c.level === filter)

  return (
    <div className="min-h-screen bg-vs-bg text-vs-text">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        {/* Page header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-vs-blue/10 border border-vs-blue/25 text-vs-blue text-sm mb-5">
            <span>🎓</span> Learning Path
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Python <span className="text-vs-blue">Courses</span>
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
              className={`px-4 py-1.5 rounded-full text-sm transition-colors duration-150 ${
                filter === l
                  ? 'bg-vs-blue text-white'
                  : 'bg-vs-surface border border-vs-border text-gray-400 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <CourseCard key={course.id} course={course} onOpen={setSelected} />
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && <CourseModal course={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
