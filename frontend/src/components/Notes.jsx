import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'
import Footer from './Footer'

const NOTES = [
  {
    id: 'variables', icon: '📦', title: 'Variables', tag: 'Fundamentals',
    tagColor: 'text-blue-400 bg-blue-900/20 border-blue-700/50',
    summary: 'A variable is a named container that stores a value in memory.',
    content: `A variable is like a labelled box that holds a value. When you write:

    a = 5

Python:
  1. Creates a memory slot
  2. Stores the value 5 inside it
  3. Labels that slot with the name "a"

Key rules:
  • Variable names are case-sensitive (age ≠ Age)
  • Must start with a letter or underscore
  • Cannot be a Python keyword (if, for, while…)`,
    codeExample: `name = "Alice"\nage = 25\nis_student = True\nprint(name, age, is_student)`,
  },
  {
    id: 'assignment', icon: '🔁', title: 'Variable Assignment & Copy', tag: 'Fundamentals',
    tagColor: 'text-blue-400 bg-blue-900/20 border-blue-700/50',
    summary: 'Assigning one variable to another copies the value, not a reference (for primitives).',
    content: `When you assign one variable to another:

    a = 5
    b = a    # b gets a COPY of a's value

Changing a later does NOT affect b:

    a = 10
    print(b)   # still 5!

This is because integers, floats, strings, and booleans are
immutable — Python creates a new object on reassignment.`,
    codeExample: `a = 5\nb = a      # b is a copy\na = 10     # changing a doesn't affect b\nprint(a)   # 10\nprint(b)   # 5`,
  },
  {
    id: 'datatypes', icon: '🔢', title: 'Data Types', tag: 'Fundamentals',
    tagColor: 'text-blue-400 bg-blue-900/20 border-blue-700/50',
    summary: 'Python has several built-in types: int, float, str, bool, list, dict, tuple, set.',
    content: `Python automatically detects the type of your data:

  int     → 42, -7, 0         (Whole numbers)
  float   → 3.14, -2.5        (Decimal numbers)
  str     → "hello", 'world'  (Text)
  bool    → True, False       (Yes/No values)
  list    → [1, 2, 3]         (Ordered collection)
  dict    → {"key": "val"}    (Key-value pairs)

Use type() to check: type(42) → <class 'int'>`,
    codeExample: `x = 42\ny = 3.14\ns = "hello"\nb = True\nprint(type(x), type(y), type(s), type(b))`,
  },
  {
    id: 'loops', icon: '🔄', title: 'Loops', tag: 'Control Flow',
    tagColor: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50',
    summary: 'Loops repeat a block of code — for loops iterate over sequences, while loops use a condition.',
    content: `for loop — iterates a fixed number of times:

    for i in range(5):
        print(i)   # 0, 1, 2, 3, 4

while loop — repeats while condition is True:

    n = 0
    while n < 5:
        n += 1

Loop control:
  • break   — exits the loop immediately
  • continue — skips to the next iteration`,
    codeExample: `total = 0\nfor i in range(1, 6):\n    total = total + i\nprint("Sum 1-5:", total)`,
  },
  {
    id: 'conditionals', icon: '🔀', title: 'Conditionals', tag: 'Control Flow',
    tagColor: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/50',
    summary: 'if / elif / else let your program choose different code paths based on conditions.',
    content: `Python uses indentation to define code blocks:

    if condition:
        # runs if True
    elif other_condition:
        # runs if first failed
    else:
        # runs if none matched

Comparison operators:  ==  !=  <  >  <=  >=
Logical operators:     and  or  not

Ternary:  result = "yes" if x > 0 else "no"`,
    codeExample: `score = 85\nif score >= 90:\n    grade = "A"\nelif score >= 75:\n    grade = "B"\nelse:\n    grade = "C"\nprint("Grade:", grade)`,
  },
  {
    id: 'functions', icon: '⚙️', title: 'Functions', tag: 'Modular Code',
    tagColor: 'text-green-400 bg-green-900/20 border-green-700/50',
    summary: 'Functions are reusable blocks of code that take inputs and produce outputs.',
    content: `Define a function with def:

    def greet(name):
        return "Hello, " + name

Call it:
    message = greet("Alice")

Default parameters:
    def power(base, exp=2):
        return base ** exp
    power(3)     # 9

Scope: Variables inside a function are local.`,
    codeExample: `def add(a, b):\n    result = a + b\n    return result\n\nx = add(3, 4)\ny = add(10, 20)\nprint(x, y)`,
  },
  {
    id: 'lists', icon: '📋', title: 'Lists', tag: 'Collections',
    tagColor: 'text-orange-400 bg-orange-900/20 border-orange-700/50',
    summary: 'Lists are ordered, mutable collections that can hold any mix of data types.',
    content: `Create a list with square brackets:

    fruits = ["apple", "banana", "cherry"]

Indexing:  fruits[0] → "apple"  |  fruits[-1] → "cherry"
Slicing:   fruits[1:3] → ["banana", "cherry"]

Common methods:
  • append(x)  — add x to the end
  • remove(x)  — remove first occurrence
  • sort()     — sort in place
  • len(list)  — get length`,
    codeExample: `nums = [3, 1, 4, 1, 5, 9]\nnums.append(2)\nnums.sort()\nprint(nums)\nprint("Length:", len(nums))`,
  },
  {
    id: 'strings', icon: '💬', title: 'Strings', tag: 'Fundamentals',
    tagColor: 'text-blue-400 bg-blue-900/20 border-blue-700/50',
    summary: 'Strings are sequences of characters. Python provides rich built-in string operations.',
    content: `Strings can use single or double quotes:

    name = "Alice"

Concatenation:  full = "Hello, " + name
f-strings:      full = f"Hello, {name}"

Common methods:
  • upper() / lower()   — change case
  • strip()             — remove whitespace
  • split(sep)          — split into list
  • len(s)              — number of characters`,
    codeExample: `msg = "  Hello, World!  "\nclean = msg.strip()\nwords = clean.split(", ")\nupper = clean.upper()\nprint(words)\nprint(upper)`,
  },
]

const ALL_TAGS = ['All', ...new Set(NOTES.map(n => n.tag))]

/* ─── NoteCard ─────────────────────────────────────────────── */
function NoteCard({ note, isOpen, onToggle }) {
  return (
    <motion.div
      className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#374151] transition-all duration-200"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 text-left">
        <span className="text-3xl shrink-0">{note.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-white font-semibold">{note.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${note.tagColor}`}>{note.tag}</span>
          </div>
          <p className="text-gray-400 text-sm truncate">{note.summary}</p>
        </div>
        <motion.span className="text-gray-500 shrink-0" animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>▶</motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1F2937] p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <h3 className="text-blue-400 text-xs font-mono tracking-widest mb-3">EXPLANATION</h3>
                <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">{note.content.trim()}</pre>
              </div>
              <div>
                <h3 className="text-green-400 text-xs font-mono tracking-widest mb-3">CODE EXAMPLE</h3>
                <div className="bg-[#0B1120] border border-[#1F2937] rounded-lg p-4">
                  <pre className="text-gray-200 font-mono text-sm leading-relaxed">{note.codeExample}</pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function Notes() {
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const toggle = (id) => setOpenId(prev => (prev === id ? null : id))

  const visible = NOTES.filter(n => {
    const matchTag    = filter === 'All' || n.tag === filter
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
                        n.summary.toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  return (
    <div className="min-h-screen bg-vs-bg text-vs-text">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">

        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-900/20 border border-green-700/40 text-green-400 text-sm mb-5">
            <span>📝</span> Quick Reference
          </div>
          <h1 className="text-4xl font-bold mb-3">Concept <span className="text-green-400">Notes</span></h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Clear, concise explanations of core programming concepts. Click any card to expand.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            type="text" placeholder="Search notes…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-[#111827] border border-[#374151] rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {ALL_TAGS.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  filter === t
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-transparent border border-[#374151] text-gray-400 hover:text-white hover:bg-[#1F2937]'
                }`}
              >{t}</button>
            ))}
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="space-y-3">
            {visible.map(note => (
              <NoteCard key={note.id} note={note} isOpen={openId === note.id} onToggle={() => toggle(note.id)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p>No notes match your search.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
