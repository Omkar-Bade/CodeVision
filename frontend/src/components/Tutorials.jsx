import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'

const TUTORIALS = [
  {
    id: 'var-assignment', icon: '📦', title: 'Variable Assignment',
    category: 'Basics', difficulty: 'Beginner', time: '2 min',
    desc: 'See how Python assigns values to variables and what happens in memory when you copy one variable into another.',
    explanation: [
      'Line 1: Python creates a memory slot named "a" and stores 5 in it.',
      'Line 2: Python reads the value of "a" (which is 5) and stores a copy in a new slot called "b".',
      'Line 3: Python updates "a" to hold 10. Notice that "b" is NOT affected — it has its own copy.',
      'Line 4: Both variables are printed showing their independent values.',
    ],
    code: `a = 5\nb = a\na = 10\nprint(a, b)`,
    output: '10 5',
  },
  {
    id: 'swap', icon: '🔄', title: 'Swapping Variables',
    category: 'Basics', difficulty: 'Beginner', time: '2 min',
    desc: "Learn the classic variable swap pattern and Python's elegant tuple-unpacking shortcut.",
    explanation: [
      'Line 1-2: Set up two variables x and y.',
      "Line 3: Use a temporary variable to save x's value before overwriting it.",
      "Line 4: Assign y's value to x.",
      'Line 5: Assign temp (original x) to y. The swap is complete!',
    ],
    code: `x = 10\ny = 20\ntemp = x\nx = y\ny = temp\nprint(x, y)`,
    output: '20 10',
  },
  {
    id: 'loop-sum', icon: '🔁', title: 'Loop: Sum of Numbers',
    category: 'Loops', difficulty: 'Beginner', time: '3 min',
    desc: 'Use a for loop with range() to accumulate a running total. Watch the "total" variable grow step by step.',
    explanation: [
      'Line 1: Initialize total to 0 — this is our accumulator.',
      'Lines 2-3: Loop runs for i = 1, 2, 3, 4, 5.',
      'Each iteration: total = total + i (add current i to running sum).',
      'Watch how total grows: 0 → 1 → 3 → 6 → 10 → 15.',
    ],
    code: `total = 0\nfor i in range(1, 6):\n    total = total + i\nprint("Sum:", total)`,
    output: 'Sum: 15',
  },
  {
    id: 'fibonacci', icon: '🌀', title: 'Fibonacci Sequence',
    category: 'Loops', difficulty: 'Beginner', time: '4 min',
    desc: 'Generate Fibonacci numbers using two variables. Observe the classic "rolling update" pattern.',
    explanation: [
      'Line 1-2: Start with a=0 and b=1 (first two Fibonacci numbers).',
      'Each iteration: compute c = a + b (next number), then shift: a becomes b, b becomes c.',
      'This is the "rolling window" pattern — we only need two variables at a time.',
    ],
    code: `a = 0\nb = 1\nfor _ in range(7):\n    c = a + b\n    a = b\n    b = c\nprint(b)`,
    output: '21',
  },
  {
    id: 'conditional-grade', icon: '🔀', title: 'Grade Calculator',
    category: 'Conditionals', difficulty: 'Beginner', time: '3 min',
    desc: 'Use if/elif/else to convert a numeric score into a letter grade. Follow the decision tree.',
    explanation: [
      'Line 1: Set the score to 85.',
      "Line 2-3: Check if score >= 90. It's not (85 < 90), so skip this block.",
      'Line 4-5: Check elif score >= 75. Yes! 85 >= 75, so grade = "B".',
      'Only ONE branch executes — the first true condition wins.',
    ],
    code: `score = 85\nif score >= 90:\n    grade = "A"\nelif score >= 75:\n    grade = "B"\nelif score >= 60:\n    grade = "C"\nelse:\n    grade = "F"\nprint("Grade:", grade)`,
    output: 'Grade: B',
  },
  {
    id: 'countdown', icon: '⏱', title: 'While Loop Countdown',
    category: 'Loops', difficulty: 'Beginner', time: '2 min',
    desc: 'A while loop that counts down and stops when the condition becomes false.',
    explanation: [
      'Line 1: n starts at 5.',
      'Each iteration: print n, then subtract 1 (n -= 1).',
      'When n becomes 0, the condition "n > 0" is False and the loop exits.',
    ],
    code: `n = 5\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint("Blast off!")`,
    output: '5\n4\n3\n2\n1\nBlast off!',
  },
  {
    id: 'string-ops', icon: '💬', title: 'String Operations',
    category: 'Strings', difficulty: 'Beginner', time: '3 min',
    desc: 'Explore common string manipulations: concatenation, upper/lower case, and length.',
    explanation: [
      'Line 1: name = "Alice" — a string variable.',
      'Line 2: Concatenate two strings with + operator.',
      'Line 3: len() returns the number of characters.',
      'Line 4: upper() returns a new string — original is unchanged.',
    ],
    code: `name = "Alice"\ngreeting = "Hello, " + name\nlength = len(name)\nupper = name.upper()\nprint(greeting)\nprint(length)\nprint(upper)`,
    output: 'Hello, Alice\n5\nALICE',
  },
  {
    id: 'nested-loop', icon: '⬛', title: 'Nested Loop: Multiplication Table',
    category: 'Loops', difficulty: 'Intermediate', time: '4 min',
    desc: 'Use nested for loops to build a multiplication table. Watch both loop variables change.',
    explanation: [
      'Outer loop: i goes from 1 to 3.',
      'Inner loop: for each i, j goes from 1 to 3.',
      'The inner loop runs completely for each value of i.',
      'Total iterations: 3 × 3 = 9.',
    ],
    code: `for i in range(1, 4):\n    for j in range(1, 4):\n        product = i * j\n        print(i, "x", j, "=", product)`,
    output: '1 x 1 = 1\n1 x 2 = 2\n...',
  },
]

const CATEGORIES = ['All', ...new Set(TUTORIALS.map(t => t.category))]

/* ─── DifficultyBadge ─────────────────────────────────────── */
function DifficultyBadge({ level }) {
  const cls = level === 'Beginner'
    ? 'text-green-400 bg-green-900/20 border-green-700/50'
    : 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${cls}`}>{level}</span>
}

/* ─── TutorialCard ────────────────────────────────────────── */
function TutorialCard({ tut, onExpand, isExpanded, onRun }) {
  return (
    <motion.div
      className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#374151] transition-all duration-200"
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{tut.icon}</span>
          <div>
            <h3 className="text-white font-semibold">{tut.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <DifficultyBadge level={tut.difficulty} />
              <span className="text-xs text-gray-500 font-mono">{tut.category}</span>
              <span className="text-xs text-gray-500 font-mono">⏱ {tut.time}</span>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{tut.desc}</p>

        <div className="flex items-center gap-2">
          <button onClick={() => onRun(tut)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors duration-150">
            ▶ Run in Visualizer
          </button>
          <button onClick={() => onExpand(tut.id)} className="px-3 py-2 bg-transparent border border-[#374151] hover:border-gray-500 text-gray-400 hover:text-white rounded-lg text-sm transition-colors">
            {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1F2937] p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <h4 className="text-xs text-blue-400 font-mono tracking-widest mb-3">STEP-BY-STEP EXPLANATION</h4>
                <ol className="space-y-2">
                  {tut.explanation.map((e, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-300">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-xs flex items-center justify-center font-mono mt-0.5">{i + 1}</span>
                      {e}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs text-green-400 font-mono tracking-widest mb-2">CODE</h4>
                  <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-4">
                    <pre className="text-gray-200 font-mono text-sm leading-relaxed">{tut.code}</pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs text-yellow-400 font-mono tracking-widest mb-2">EXPECTED OUTPUT</h4>
                  <div className="bg-[#0d1117] border border-[#1F2937] rounded-lg p-3">
                    <pre className="text-green-400 font-mono text-sm">{tut.output}</pre>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => onRun(tut)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-150">
                ▶ Open in CodeVision Visualizer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function Tutorials() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(null)
  const [category, setCategory] = useState('All')

  const toggle = (id) => setExpanded(prev => (prev === id ? null : id))
  const runInVisualizer = (tut) => navigate('/visualizer', { state: { code: tut.code } })

  const visible = category === 'All' ? TUTORIALS : TUTORIALS.filter(t => t.category === category)

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E5E7EB]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">

        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-900/20 border border-violet-700/40 text-violet-400 text-sm mb-5">
            <span>🚀</span> Interactive Tutorials
          </div>
          <h1 className="text-4xl font-bold mb-3">Learn by <span className="text-violet-400">Doing</span></h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Each tutorial includes step-by-step explanations.
            Click <span className="text-blue-400">▶ Run in Visualizer</span> to see code execute live.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
                category === cat
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'bg-transparent border border-[#374151] text-gray-400 hover:text-white hover:bg-[#1F2937]'
              }`}
            >{cat}</button>
          ))}
        </div>

        <div className="flex justify-center gap-8 mb-8 text-center">
          {[
            { label: 'Tutorials',   value: visible.length },
            { label: 'Beginner',    value: visible.filter(t => t.difficulty === 'Beginner').length },
            { label: 'Interactive', value: visible.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {visible.map(tut => (
            <TutorialCard key={tut.id} tut={tut} isExpanded={expanded === tut.id} onExpand={toggle} onRun={runInVisualizer} />
          ))}
        </div>

        <motion.div className="mt-12 text-center bg-[#111827] border border-[#1F2937] rounded-xl p-8"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        >
          <h3 className="text-xl font-bold text-white mb-2">Ready to visualize your own code?</h3>
          <p className="text-gray-400 text-sm mb-5">Open the CodeVision Visualizer and type any Python code to see it run.</p>
          <button onClick={() => navigate('/visualizer')} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors duration-150">
            Open Visualizer →
          </button>
        </motion.div>
      </div>
    </div>
  )
}
