import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'

const TUTORIALS = [
  {
    id: 'var-assignment',
    icon: '📦',
    title: 'Variable Assignment',
    category: 'Basics',
    difficulty: 'Beginner',
    time: '2 min',
    desc: 'See how Python assigns values to variables and what happens in memory when you copy one variable into another.',
    explanation: [
      'Line 1: Python creates a memory slot named "a" and stores 5 in it.',
      'Line 2: Python reads the value of "a" (which is 5) and stores a copy in a new slot called "b".',
      'Line 3: Python updates "a" to hold 10. Notice that "b" is NOT affected — it has its own copy of the value 5.',
      'Line 4: Both variables are printed showing their independent values.',
    ],
    code: `a = 5
b = a
a = 10
print(a, b)`,
    output: '10 5',
  },
  {
    id: 'swap',
    icon: '🔄',
    title: 'Swapping Variables',
    category: 'Basics',
    difficulty: 'Beginner',
    time: '2 min',
    desc: 'Learn the classic variable swap pattern and Python\'s elegant tuple-unpacking shortcut.',
    explanation: [
      'Line 1-2: Set up two variables x and y.',
      'Line 3: Use a temporary variable "temp" to save x\'s value before overwriting it.',
      'Line 4: Assign y\'s value to x.',
      'Line 5: Assign temp (original x) to y. The swap is complete!',
      'Alternatively: Python lets you swap in one line: x, y = y, x',
    ],
    code: `x = 10
y = 20
temp = x
x = y
y = temp
print(x, y)`,
    output: '20 10',
  },
  {
    id: 'loop-sum',
    icon: '🔁',
    title: 'Loop: Sum of Numbers',
    category: 'Loops',
    difficulty: 'Beginner',
    time: '3 min',
    desc: 'Use a for loop with range() to accumulate a running total. Watch the "total" variable grow step by step.',
    explanation: [
      'Line 1: Initialize total to 0 — this is our accumulator.',
      'Lines 2-3: Loop runs for i = 1, 2, 3, 4, 5.',
      'Each iteration: total = total + i (add current i to running sum).',
      'After loop: total holds 1+2+3+4+5 = 15.',
      'Watch how total grows: 0 → 1 → 3 → 6 → 10 → 15.',
    ],
    code: `total = 0
for i in range(1, 6):
    total = total + i
print("Sum:", total)`,
    output: 'Sum: 15',
  },
  {
    id: 'fibonacci',
    icon: '🌀',
    title: 'Fibonacci Sequence',
    category: 'Loops',
    difficulty: 'Beginner',
    time: '4 min',
    desc: 'Generate Fibonacci numbers using two variables. Observe the classic "rolling update" pattern.',
    explanation: [
      'Line 1-2: Start with a=0 and b=1 (first two Fibonacci numbers).',
      'Each iteration: compute c = a + b (next number), then shift: a becomes b, b becomes c.',
      'After 6 iterations: 0, 1, 1, 2, 3, 5, 8, 13...',
      'This is the "rolling window" pattern — we only need two variables at a time.',
    ],
    code: `a = 0
b = 1
for _ in range(7):
    c = a + b
    a = b
    b = c
print(b)`,
    output: '21',
  },
  {
    id: 'conditional-grade',
    icon: '🔀',
    title: 'Grade Calculator',
    category: 'Conditionals',
    difficulty: 'Beginner',
    time: '3 min',
    desc: 'Use if/elif/else to convert a numeric score into a letter grade. Follow the decision tree.',
    explanation: [
      'Line 1: Set the score to 85.',
      'Line 2-3: Check if score >= 90. It\'s not (85 < 90), so skip this block.',
      'Line 4-5: Check elif score >= 75. Yes! 85 >= 75, so grade = "B".',
      'The else block is skipped entirely.',
      'Only ONE branch executes — the first true condition wins.',
    ],
    code: `score = 85
if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "F"
print("Grade:", grade)`,
    output: 'Grade: B',
  },
  {
    id: 'countdown',
    icon: '⏱',
    title: 'While Loop Countdown',
    category: 'Loops',
    difficulty: 'Beginner',
    time: '2 min',
    desc: 'A while loop that counts down and stops when the condition becomes false.',
    explanation: [
      'Line 1: n starts at 5.',
      'Each iteration: print n, then subtract 1 (n -= 1).',
      'Loop condition "n > 0" is checked before each iteration.',
      'When n becomes 0, the condition is False and the loop exits.',
      'Watch n decrease: 5 → 4 → 3 → 2 → 1 → 0 (exit).',
    ],
    code: `n = 5
while n > 0:
    print(n)
    n = n - 1
print("Blast off!")`,
    output: '5\n4\n3\n2\n1\nBlast off!',
  },
  {
    id: 'string-ops',
    icon: '💬',
    title: 'String Operations',
    category: 'Strings',
    difficulty: 'Beginner',
    time: '3 min',
    desc: 'Explore common string manipulations: concatenation, upper/lower case, and length.',
    explanation: [
      'Line 1: name = "Alice" — a string variable.',
      'Line 2: Concatenate two strings with + operator.',
      'Line 3: len() returns the number of characters.',
      'Line 4: upper() returns a new string — original is unchanged.',
      'Strings in Python are immutable: methods return new strings.',
    ],
    code: `name = "Alice"
greeting = "Hello, " + name
length = len(name)
upper = name.upper()
print(greeting)
print(length)
print(upper)`,
    output: 'Hello, Alice\n5\nALICE',
  },
  {
    id: 'nested-loop',
    icon: '⬛',
    title: 'Nested Loop: Multiplication Table',
    category: 'Loops',
    difficulty: 'Intermediate',
    time: '4 min',
    desc: 'Use nested for loops to build a multiplication table. Watch both loop variables change.',
    explanation: [
      'Outer loop: i goes from 1 to 3.',
      'Inner loop: for each i, j goes from 1 to 3.',
      'The inner loop runs completely for each value of i.',
      'Total iterations: 3 × 3 = 9.',
      'Watch how i stays constant while j cycles through 1, 2, 3.',
    ],
    code: `for i in range(1, 4):
    for j in range(1, 4):
        product = i * j
        print(i, "x", j, "=", product)`,
    output: '1 x 1 = 1\n1 x 2 = 2\n...',
  },
]

const CATEGORIES = ['All', ...new Set(TUTORIALS.map(t => t.category))]

/* ─── DifficultyBadge ─────────────────────────────────────── */
function DifficultyBadge({ level }) {
  const cls = level === 'Beginner'
    ? 'text-vs-green bg-vs-green/10 border-vs-green/30'
    : 'text-vs-yellow bg-vs-yellow/10 border-vs-yellow/30'
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${cls}`}>
      {level}
    </span>
  )
}

/* ─── TutorialCard ────────────────────────────────────────── */
function TutorialCard({ tut, onExpand, isExpanded, onRun }) {
  return (
    <motion.div
      className="bg-vs-surface border border-vs-border rounded-xl overflow-hidden
                 hover:border-gray-500 transition-colors duration-200"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
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
        </div>

        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{tut.desc}</p>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => onRun(tut)}
            className="flex items-center gap-2 px-4 py-2 bg-vs-blue hover:bg-blue-500
                       text-white rounded-lg text-sm font-semibold transition-colors duration-150"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            ▶ Run in Visualizer
          </motion.button>
          <button
            onClick={() => onExpand(tut.id)}
            className="px-3 py-2 bg-vs-bg border border-vs-border hover:border-gray-500
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
            <div className="border-t border-vs-border p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Explanation */}
              <div>
                <h4 className="text-xs text-vs-blue font-mono tracking-widest mb-3">
                  STEP-BY-STEP EXPLANATION
                </h4>
                <ol className="space-y-2">
                  {tut.explanation.map((e, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-300">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-vs-blue/20 text-vs-blue
                                       text-xs flex items-center justify-center font-mono mt-0.5">
                        {i + 1}
                      </span>
                      {e}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Code + expected output */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs text-vs-green font-mono tracking-widest mb-2">CODE</h4>
                  <div className="bg-vs-bg border border-vs-border rounded-lg p-4">
                    <pre className="text-vs-text font-mono text-sm leading-relaxed">
                      {tut.code}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs text-vs-yellow font-mono tracking-widest mb-2">
                    EXPECTED OUTPUT
                  </h4>
                  <div className="bg-black/40 border border-vs-border rounded-lg p-3">
                    <pre className="text-vs-green font-mono text-sm">{tut.output}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <motion.button
                onClick={() => onRun(tut)}
                className="w-full py-3 bg-gradient-to-r from-vs-blue to-blue-500
                           text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                ▶ Open in CodeVision Visualizer
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function Tutorials() {
  const navigate    = useNavigate()
  const [expanded,  setExpanded]  = useState(null)
  const [category,  setCategory]  = useState('All')

  const toggle = (id) => setExpanded(prev => (prev === id ? null : id))

  const runInVisualizer = (tut) => {
    navigate('/visualizer', { state: { code: tut.code } })
  }

  const visible = category === 'All'
    ? TUTORIALS
    : TUTORIALS.filter(t => t.category === category)

  return (
    <div className="min-h-screen bg-vs-bg text-vs-text">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16">
        {/* Page header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-vs-purple/10 border border-vs-purple/25 text-vs-purple text-sm mb-5">
            <span>🚀</span> Interactive Tutorials
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Learn by <span className="text-vs-purple">Doing</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Each tutorial includes step-by-step explanations.
            Click <span className="text-vs-blue">▶ Run in Visualizer</span> to see the code
            execute live in CodeVision.
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors duration-150 ${
                category === cat
                  ? 'bg-vs-purple text-white'
                  : 'bg-vs-surface border border-vs-border text-gray-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex justify-center gap-8 mb-8 text-center">
          {[
            { label: 'Tutorials', value: visible.length },
            { label: 'Beginner',  value: visible.filter(t => t.difficulty === 'Beginner').length },
            { label: 'Interactive', value: visible.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Tutorial list */}
        <div className="space-y-4">
          {visible.map(tut => (
            <TutorialCard
              key={tut.id}
              tut={tut}
              isExpanded={expanded === tut.id}
              onExpand={toggle}
              onRun={runInVisualizer}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-12 text-center bg-gradient-to-r from-vs-blue/10 to-vs-purple/10
                     border border-vs-border rounded-2xl p-8"
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
          <motion.button
            onClick={() => navigate('/visualizer')}
            className="px-8 py-3 bg-vs-blue hover:bg-blue-500 text-white rounded-lg
                       font-semibold transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
          >
            Open Visualizer →
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
