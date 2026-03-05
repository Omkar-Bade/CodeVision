import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './Navbar'

const NOTES = [
  {
    id: 'variables',
    icon: '📦',
    title: 'Variables',
    tag: 'Fundamentals',
    tagColor: 'text-vs-blue bg-vs-blue/10 border-vs-blue/30',
    summary: 'A variable is a named container that stores a value in memory.',
    content: `
A **variable** is like a labelled box that holds a value. When you write:

    a = 5

Python:
  1. Creates a memory slot
  2. Stores the value 5 inside it
  3. Labels that slot with the name "a"

You can later read or change the value using the same name.

    a = 5      # a points to 5
    a = 10     # a now points to 10 (5 still exists briefly)

**Key rules:**
  • Variable names are case-sensitive (age ≠ Age)
  • Must start with a letter or underscore
  • Can contain letters, numbers, underscores
  • Cannot be a Python keyword (if, for, while…)
    `,
    codeExample: `name = "Alice"
age = 25
is_student = True
print(name, age, is_student)`,
  },
  {
    id: 'assignment',
    icon: '🔁',
    title: 'Variable Assignment & Copy',
    tag: 'Fundamentals',
    tagColor: 'text-vs-blue bg-vs-blue/10 border-vs-blue/30',
    summary: 'Assigning one variable to another copies the value, not a reference (for primitives).',
    content: `
When you assign one variable to another:

    a = 5
    b = a    # b gets a COPY of a's value

Changing **a** later does NOT affect **b**:

    a = 10
    print(b)   # still 5!

This is because integers, floats, strings, and booleans are
**immutable** — Python creates a new object on reassignment.

**Important:** Lists and dictionaries behave differently —
they are **mutable** and assignment copies only the reference.
    `,
    codeExample: `a = 5
b = a      # b is a copy
a = 10     # changing a doesn't affect b
print(a)   # 10
print(b)   # 5`,
  },
  {
    id: 'datatypes',
    icon: '🔢',
    title: 'Data Types',
    tag: 'Fundamentals',
    tagColor: 'text-vs-blue bg-vs-blue/10 border-vs-blue/30',
    summary: 'Python has several built-in types: int, float, str, bool, list, dict, tuple, set.',
    content: `
Python automatically detects the type of your data:

  | Type    | Example           | Description          |
  |---------|-------------------|----------------------|
  | int     | 42, -7, 0         | Whole numbers        |
  | float   | 3.14, -2.5        | Decimal numbers      |
  | str     | "hello", 'world'  | Text                 |
  | bool    | True, False       | Yes/No values        |
  | list    | [1, 2, 3]         | Ordered collection   |
  | dict    | {"key": "val"}    | Key-value pairs      |
  | tuple   | (1, 2, 3)         | Immutable sequence   |
  | set     | {1, 2, 3}         | Unique collection    |

Use **type()** to check: type(42) → <class 'int'>
Use **isinstance()** to test: isinstance(42, int) → True
    `,
    codeExample: `x = 42
y = 3.14
s = "hello"
b = True
print(type(x), type(y), type(s), type(b))`,
  },
  {
    id: 'loops',
    icon: '🔄',
    title: 'Loops',
    tag: 'Control Flow',
    tagColor: 'text-vs-yellow bg-vs-yellow/10 border-vs-yellow/30',
    summary: 'Loops repeat a block of code — for loops iterate over sequences, while loops use a condition.',
    content: `
**for loop** — iterates a fixed number of times:

    for i in range(5):
        print(i)   # 0, 1, 2, 3, 4

**while loop** — repeats while condition is True:

    n = 0
    while n < 5:
        print(n)
        n += 1

**Loop control:**
  • break   — exits the loop immediately
  • continue — skips to the next iteration
  • pass    — does nothing (placeholder)

**Tip:** range(start, stop, step) controls the sequence.
range(0, 10, 2) → 0, 2, 4, 6, 8
    `,
    codeExample: `total = 0
for i in range(1, 6):
    total = total + i
print("Sum 1-5:", total)`,
  },
  {
    id: 'conditionals',
    icon: '🔀',
    title: 'Conditionals',
    tag: 'Control Flow',
    tagColor: 'text-vs-yellow bg-vs-yellow/10 border-vs-yellow/30',
    summary: 'if / elif / else let your program choose different code paths based on conditions.',
    content: `
Python uses indentation to define code blocks:

    if condition:
        # runs if condition is True
    elif other_condition:
        # runs if first failed and this is True
    else:
        # runs if none of the above

**Comparison operators:**
  ==  equal           !=  not equal
  <   less than       >   greater than
  <=  less or equal   >=  greater or equal

**Logical operators:**
  and  — both must be True
  or   — at least one must be True
  not  — reverses True/False

**Ternary expression:**
  result = "yes" if x > 0 else "no"
    `,
    codeExample: `score = 85
if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
else:
    grade = "C"
print("Grade:", grade)`,
  },
  {
    id: 'functions',
    icon: '⚙️',
    title: 'Functions',
    tag: 'Modular Code',
    tagColor: 'text-vs-green bg-vs-green/10 border-vs-green/30',
    summary: 'Functions are reusable blocks of code that take inputs (parameters) and produce outputs (return values).',
    content: `
Define a function with **def**:

    def greet(name):
        return "Hello, " + name

Call it:

    message = greet("Alice")

**Parameters vs Arguments:**
  • Parameters: names in the definition  (name)
  • Arguments: actual values you pass    ("Alice")

**Default parameters:**
    def power(base, exp=2):
        return base ** exp
    power(3)     # 9
    power(2, 3)  # 8

**Scope:**
  Variables inside a function are **local** — they don't
  exist outside the function unless returned.
    `,
    codeExample: `def add(a, b):
    result = a + b
    return result

x = add(3, 4)
y = add(10, 20)
print(x, y)`,
  },
  {
    id: 'lists',
    icon: '📋',
    title: 'Lists',
    tag: 'Collections',
    tagColor: 'text-vs-orange bg-vs-orange/10 border-vs-orange/30',
    summary: 'Lists are ordered, mutable collections that can hold any mix of data types.',
    content: `
Create a list with square brackets:

    fruits = ["apple", "banana", "cherry"]

**Indexing:** (starts at 0)
    fruits[0]    → "apple"
    fruits[-1]   → "cherry"   (last item)

**Slicing:**
    fruits[1:3]  → ["banana", "cherry"]

**Common methods:**
  • append(x)   — add x to the end
  • insert(i,x) — insert x at position i
  • remove(x)   — remove first occurrence of x
  • pop()       — remove and return last item
  • sort()      — sort in place
  • len(list)   — length (not a method, a function)

**Iteration:**
    for fruit in fruits:
        print(fruit)
    `,
    codeExample: `nums = [3, 1, 4, 1, 5, 9]
nums.append(2)
nums.sort()
print(nums)
print("Length:", len(nums))`,
  },
  {
    id: 'strings',
    icon: '💬',
    title: 'Strings',
    tag: 'Fundamentals',
    tagColor: 'text-vs-blue bg-vs-blue/10 border-vs-blue/30',
    summary: 'Strings are sequences of characters. Python provides rich built-in string operations.',
    content: `
Strings can use single or double quotes:

    name = "Alice"
    greeting = 'Hello'

**Concatenation:**
    full = greeting + ", " + name   → "Hello, Alice"

**f-strings (modern, recommended):**
    full = f"Hello, {name}"

**Common methods:**
  • upper() / lower()     — change case
  • strip()               — remove whitespace
  • split(sep)            — split into list
  • replace(old, new)     — substitute
  • find(sub)             — index of substring
  • len(s)                — number of characters

**Indexing & slicing** work like lists:
    s = "Python"
    s[0]    → "P"
    s[-1]   → "n"
    s[0:3]  → "Pyt"
    `,
    codeExample: `msg = "  Hello, World!  "
clean = msg.strip()
words = clean.split(", ")
upper = clean.upper()
print(words)
print(upper)`,
  },
]

const ALL_TAGS = ['All', ...new Set(NOTES.map(n => n.tag))]

/* ─── NoteCard ─────────────────────────────────────────────── */
function NoteCard({ note, isOpen, onToggle }) {
  return (
    <motion.div
      className="bg-slate-900/70 border border-slate-700/70 rounded-2xl overflow-hidden
                 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-slate-500/70
                 hover:shadow-[0_8px_32px_rgba(0,0,0,0.65)] hover:-translate-y-px
                 transition-all duration-200"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <span className="text-3xl shrink-0">{note.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-white font-semibold">{note.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${note.tagColor}`}>
              {note.tag}
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
            <div className="border-t border-vs-border p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Explanation */}
              <div>
                <h3 className="text-vs-blue text-xs font-mono tracking-widest mb-3">EXPLANATION</h3>
                <pre className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                  {note.content.trim()}
                </pre>
              </div>

              {/* Code example */}
              <div>
                <h3 className="text-vs-green text-xs font-mono tracking-widest mb-3">CODE EXAMPLE</h3>
                <div className="bg-vs-bg border border-vs-border rounded-lg p-4">
                  <pre className="text-vs-text font-mono text-sm leading-relaxed">
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

/* ─── Page ─────────────────────────────────────────────────── */
export default function Notes() {
  const [openId,  setOpenId]  = useState(null)
  const [filter,  setFilter]  = useState('All')
  const [search,  setSearch]  = useState('')

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

      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16">
        {/* Page header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-vs-green/10 border border-vs-green/25 text-vs-green text-sm mb-5">
            <span>📝</span> Quick Reference
          </div>
          <h1 className="text-4xl font-bold mb-3">
            Concept <span className="text-vs-green">Notes</span>
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
            className="flex-1 bg-vs-surface border border-vs-border rounded-lg px-4 py-2
                       text-sm text-vs-text placeholder-gray-600 focus:outline-none
                       focus:border-vs-blue transition-colors"
          />
          <div className="flex gap-2">
            {ALL_TAGS.map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  filter === t
                    ? 'bg-vs-blue text-white'
                    : 'bg-vs-surface border border-vs-border text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notes list */}
        {visible.length > 0 ? (
          <div className="space-y-3">
            {visible.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                isOpen={openId === note.id}
                onToggle={() => toggle(note.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p>No notes match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
