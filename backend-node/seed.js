/**
 * seed.js — Populate MongoDB with the initial Courses, Notes, and Tutorials
 * data migrated from the frontend's hardcoded arrays.
 *
 * Run once:   npm run seed
 * Re-running: existing documents are dropped and replaced.
 */

require('dotenv').config()
const mongoose = require('mongoose')
const Course   = require('./models/Course')
const Note     = require('./models/Note')
const Tutorial = require('./models/Tutorial')

// ── Seed data ───────────────────────────────────────────────────

const COURSES = [
  {
    order: 1,
    icon: '🐍',
    title: 'Python Basics',
    description: 'Start your Python journey with fundamental concepts, syntax, and your very first program.',
    level: 'Beginner',
    duration: '2 hrs',
    topics: [
      'What is Python and why use it?',
      'Installing Python and setting up your environment',
      'Writing your first "Hello, World!" program',
      'Understanding indentation and code blocks',
      'Comments: single-line and multi-line',
      'Using the Python REPL interactively',
    ],
    lessons: [
      { title: 'Introduction to Python',    mins: 12 },
      { title: 'Your First Program',         mins: 8  },
      { title: 'Understanding Syntax',       mins: 10 },
      { title: 'Working with the REPL',      mins: 7  },
    ],
  },
  {
    order: 2,
    icon: '📦',
    title: 'Variables & Data Types',
    description: 'Understand how Python stores information — integers, floats, strings, booleans, and more.',
    level: 'Beginner',
    duration: '1.5 hrs',
    topics: [
      'What is a variable? Naming rules',
      'int, float, str, bool data types',
      'Type checking with type()',
      'Type conversion: int(), str(), float()',
      'Multiple assignment in one line',
      'Constants and best practices',
    ],
    lessons: [
      { title: 'Variables Explained',   mins: 10 },
      { title: 'Numeric Types',         mins: 9  },
      { title: 'Strings & Booleans',    mins: 11 },
      { title: 'Type Conversion',       mins: 8  },
    ],
  },
  {
    order: 3,
    icon: '🔄',
    title: 'Loops',
    description: 'Master iteration — repeat actions with for loops, while loops, and loop control statements.',
    level: 'Beginner',
    duration: '2 hrs',
    topics: [
      'for loop with range()',
      'Iterating over lists and strings',
      'while loop and condition-based looping',
      'break, continue, and pass',
      'Nested loops',
      'Loop patterns: sum, count, accumulate',
    ],
    lessons: [
      { title: 'The for Loop',              mins: 12 },
      { title: 'The while Loop',            mins: 10 },
      { title: 'Loop Control Statements',   mins: 9  },
      { title: 'Nested Loops',              mins: 11 },
    ],
  },
  {
    order: 4,
    icon: '🔀',
    title: 'Conditional Statements',
    description: 'Make your programs smart — use if, elif, else to control the flow of execution.',
    level: 'Beginner',
    duration: '1.5 hrs',
    topics: [
      'Boolean expressions and comparisons',
      'if / else statements',
      'elif chains',
      'Nested conditionals',
      'Ternary (one-line) if expressions',
      'Logical operators: and, or, not',
    ],
    lessons: [
      { title: 'Boolean Logic',      mins: 8  },
      { title: 'if and else',        mins: 10 },
      { title: 'elif Chains',        mins: 9  },
      { title: 'Nested & Ternary',   mins: 8  },
    ],
  },
  {
    order: 5,
    icon: '📋',
    title: 'Lists & Collections',
    description: 'Work with groups of data using lists, tuples, dictionaries, and sets.',
    level: 'Intermediate',
    duration: '2.5 hrs',
    topics: [
      'Creating and indexing lists',
      'List methods: append, remove, sort',
      'List slicing and comprehensions',
      'Tuples vs lists',
      'Dictionaries: key-value storage',
      'Sets: unique collections',
    ],
    lessons: [
      { title: 'Lists Deep Dive',   mins: 15 },
      { title: 'Tuples',            mins: 8  },
      { title: 'Dictionaries',      mins: 14 },
      { title: 'Sets',              mins: 8  },
    ],
  },
  {
    order: 6,
    icon: '⚙️',
    title: 'Functions',
    description: 'Learn to write reusable, modular code using functions, parameters, and return values.',
    level: 'Intermediate',
    duration: '2 hrs',
    topics: [
      'Defining functions with def',
      'Parameters and arguments',
      'Return values',
      'Default and keyword arguments',
      'Scope: local vs global variables',
      'Lambda functions',
    ],
    lessons: [
      { title: 'Defining Functions',     mins: 12 },
      { title: 'Parameters & Returns',   mins: 11 },
      { title: 'Scope',                  mins: 10 },
      { title: 'Lambda & Advanced',      mins: 9  },
    ],
  },
]

const NOTES = [
  {
    order: 1,
    icon: '📦',
    title: 'Variables',
    summary: 'A variable is a named container that stores a value in memory.',
    category: 'Fundamentals',
    tags: ['variables', 'memory', 'assignment'],
    content: `A variable is like a labelled box that holds a value. When you write:

    a = 5

Python:
  1. Creates a memory slot
  2. Stores the value 5 inside it
  3. Labels that slot with the name "a"

You can later read or change the value using the same name.

    a = 5      # a points to 5
    a = 10     # a now points to 10

Key rules:
  • Variable names are case-sensitive (age ≠ Age)
  • Must start with a letter or underscore
  • Can contain letters, numbers, underscores
  • Cannot be a Python keyword (if, for, while…)`,
    codeExample: `name = "Alice"
age = 25
is_student = True
print(name, age, is_student)`,
  },
  {
    order: 2,
    icon: '🔁',
    title: 'Variable Assignment & Copy',
    summary: 'Assigning one variable to another copies the value, not a reference (for primitives).',
    category: 'Fundamentals',
    tags: ['assignment', 'copy', 'immutable'],
    content: `When you assign one variable to another:

    a = 5
    b = a    # b gets a COPY of a's value

Changing a later does NOT affect b:

    a = 10
    print(b)   # still 5!

This is because integers, floats, strings, and booleans are
immutable — Python creates a new object on reassignment.

Important: Lists and dictionaries behave differently —
they are mutable and assignment copies only the reference.`,
    codeExample: `a = 5
b = a      # b is a copy
a = 10     # changing a doesn't affect b
print(a)   # 10
print(b)   # 5`,
  },
  {
    order: 3,
    icon: '🔢',
    title: 'Data Types',
    summary: 'Python has several built-in types: int, float, str, bool, list, dict, tuple, set.',
    category: 'Fundamentals',
    tags: ['types', 'int', 'str', 'bool', 'list'],
    content: `Python automatically detects the type of your data:

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

Use type() to check: type(42) → <class 'int'>
Use isinstance() to test: isinstance(42, int) → True`,
    codeExample: `x = 42
y = 3.14
s = "hello"
b = True
print(type(x), type(y), type(s), type(b))`,
  },
  {
    order: 4,
    icon: '🔄',
    title: 'Loops',
    summary: 'Loops repeat a block of code — for loops iterate over sequences, while loops use a condition.',
    category: 'Control Flow',
    tags: ['loops', 'for', 'while', 'range'],
    content: `for loop — iterates a fixed number of times:

    for i in range(5):
        print(i)   # 0, 1, 2, 3, 4

while loop — repeats while condition is True:

    n = 0
    while n < 5:
        print(n)
        n += 1

Loop control:
  • break   — exits the loop immediately
  • continue — skips to the next iteration
  • pass    — does nothing (placeholder)

Tip: range(start, stop, step) controls the sequence.
range(0, 10, 2) → 0, 2, 4, 6, 8`,
    codeExample: `total = 0
for i in range(1, 6):
    total = total + i
print("Sum 1-5:", total)`,
  },
  {
    order: 5,
    icon: '🔀',
    title: 'Conditionals',
    summary: 'if / elif / else let your program choose different code paths based on conditions.',
    category: 'Control Flow',
    tags: ['if', 'elif', 'else', 'conditionals'],
    content: `Python uses indentation to define code blocks:

    if condition:
        # runs if condition is True
    elif other_condition:
        # runs if first failed and this is True
    else:
        # runs if none of the above

Comparison operators:
  ==  equal           !=  not equal
  <   less than       >   greater than
  <=  less or equal   >=  greater or equal

Logical operators:
  and  — both must be True
  or   — at least one must be True
  not  — reverses True/False

Ternary expression:
  result = "yes" if x > 0 else "no"`,
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
    order: 6,
    icon: '⚙️',
    title: 'Functions',
    summary: 'Functions are reusable blocks of code that take inputs (parameters) and produce outputs (return values).',
    category: 'Modular Code',
    tags: ['functions', 'def', 'return', 'parameters'],
    content: `Define a function with def:

    def greet(name):
        return "Hello, " + name

Call it:

    message = greet("Alice")

Parameters vs Arguments:
  • Parameters: names in the definition  (name)
  • Arguments: actual values you pass    ("Alice")

Default parameters:
    def power(base, exp=2):
        return base ** exp
    power(3)     # 9
    power(2, 3)  # 8

Scope:
  Variables inside a function are local — they don't
  exist outside the function unless returned.`,
    codeExample: `def add(a, b):
    result = a + b
    return result

x = add(3, 4)
y = add(10, 20)
print(x, y)`,
  },
  {
    order: 7,
    icon: '📋',
    title: 'Lists',
    summary: 'Lists are ordered, mutable collections that can hold any mix of data types.',
    category: 'Collections',
    tags: ['list', 'append', 'slice', 'index'],
    content: `Create a list with square brackets:

    fruits = ["apple", "banana", "cherry"]

Indexing: (starts at 0)
    fruits[0]    → "apple"
    fruits[-1]   → "cherry"   (last item)

Slicing:
    fruits[1:3]  → ["banana", "cherry"]

Common methods:
  • append(x)   — add x to the end
  • insert(i,x) — insert x at position i
  • remove(x)   — remove first occurrence of x
  • pop()       — remove and return last item
  • sort()      — sort in place
  • len(list)   — length (not a method, a function)

Iteration:
    for fruit in fruits:
        print(fruit)`,
    codeExample: `nums = [3, 1, 4, 1, 5, 9]
nums.append(2)
nums.sort()
print(nums)
print("Length:", len(nums))`,
  },
  {
    order: 8,
    icon: '💬',
    title: 'Strings',
    summary: 'Strings are sequences of characters. Python provides rich built-in string operations.',
    category: 'Fundamentals',
    tags: ['strings', 'concat', 'upper', 'split', 'format'],
    content: `Strings can use single or double quotes:

    name = "Alice"
    greeting = 'Hello'

Concatenation:
    full = greeting + ", " + name   → "Hello, Alice"

f-strings (modern, recommended):
    full = f"Hello, {name}"

Common methods:
  • upper() / lower()     — change case
  • strip()               — remove whitespace
  • split(sep)            — split into list
  • replace(old, new)     — substitute
  • find(sub)             — index of substring
  • len(s)                — number of characters

Indexing & slicing work like lists:
    s = "Python"
    s[0]    → "P"
    s[-1]   → "n"
    s[0:3]  → "Pyt"`,
    codeExample: `msg = "  Hello, World!  "
clean = msg.strip()
words = clean.split(", ")
upper = clean.upper()
print(words)
print(upper)`,
  },
]

const TUTORIALS = [
  {
    order: 1,
    icon: '📦',
    title: 'Variable Assignment',
    description: 'See how Python assigns values to variables and what happens in memory when you copy one variable into another.',
    level: 'Beginner',
    topic: 'Basics',
    time: '2 min',
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
    order: 2,
    icon: '🔄',
    title: 'Swapping Variables',
    description: "Learn the classic variable swap pattern and Python's elegant tuple-unpacking shortcut.",
    level: 'Beginner',
    topic: 'Basics',
    time: '2 min',
    explanation: [
      'Line 1-2: Set up two variables x and y.',
      "Line 3: Use a temporary variable to save x's value before overwriting it.",
      "Line 4: Assign y's value to x.",
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
    order: 3,
    icon: '🔁',
    title: 'Loop: Sum of Numbers',
    description: 'Use a for loop with range() to accumulate a running total. Watch the "total" variable grow step by step.',
    level: 'Beginner',
    topic: 'Loops',
    time: '3 min',
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
    order: 4,
    icon: '🌀',
    title: 'Fibonacci Sequence',
    description: 'Generate Fibonacci numbers using two variables. Observe the classic "rolling update" pattern.',
    level: 'Beginner',
    topic: 'Loops',
    time: '4 min',
    explanation: [
      'Line 1-2: Start with a=0 and b=1 (first two Fibonacci numbers).',
      'Each iteration: compute c = a + b (next number), then shift: a becomes b, b becomes c.',
      'After 7 iterations: 0, 1, 1, 2, 3, 5, 8, 13, 21...',
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
    order: 5,
    icon: '🔀',
    title: 'Grade Calculator',
    description: 'Use if/elif/else to convert a numeric score into a letter grade. Follow the decision tree.',
    level: 'Beginner',
    topic: 'Conditionals',
    time: '3 min',
    explanation: [
      'Line 1: Set the score to 85.',
      "Line 2-3: Check if score >= 90. It's not (85 < 90), so skip this block.",
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
    order: 6,
    icon: '⏱',
    title: 'While Loop Countdown',
    description: 'A while loop that counts down and stops when the condition becomes false.',
    level: 'Beginner',
    topic: 'Loops',
    time: '2 min',
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
    order: 7,
    icon: '💬',
    title: 'String Operations',
    description: 'Explore common string manipulations: concatenation, upper/lower case, and length.',
    level: 'Beginner',
    topic: 'Strings',
    time: '3 min',
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
    order: 8,
    icon: '⬛',
    title: 'Nested Loop: Multiplication Table',
    description: 'Use nested for loops to build a multiplication table. Watch both loop variables change.',
    level: 'Intermediate',
    topic: 'Loops',
    time: '4 min',
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

// ── Main seed function ──────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // Drop existing collections before re-seeding
    await Course.deleteMany({})
    await Note.deleteMany({})
    await Tutorial.deleteMany({})
    console.log('Cleared existing data')

    await Course.insertMany(COURSES)
    console.log(`Inserted ${COURSES.length} courses`)

    await Note.insertMany(NOTES)
    console.log(`Inserted ${NOTES.length} notes`)

    await Tutorial.insertMany(TUTORIALS)
    console.log(`Inserted ${TUTORIALS.length} tutorials`)

    console.log('\n✓ Seed complete! Run the server with: npm run dev')
  } catch (err) {
    console.error('Seed failed:', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

seed()
