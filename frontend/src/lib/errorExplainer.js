/**
 * errorExplainer.js
 *
 * Converts raw linter marker messages into rich, beginner-friendly
 * explanations with a plain-English description, a fix hint, and an
 * example code snippet.
 *
 * Each explanation object:
 *   { type, title, explanation, hint, example }
 */

// ── Pattern → explanation rules ─────────────────────────────────
// Each rule has a `test` regex matched against the marker message,
// and a factory that receives the regex match + the marker to build
// a contextual explanation.

const RULES = [
  // ── Missing colon ────────────────────────────────────────────
  {
    test: /expected ':' .* '(\w+)' statement/,
    build: (m) => ({
      type:        'SyntaxError',
      title:       `Missing colon after '${m[1]}'`,
      explanation: `In Python, control statements like **${m[1]}**, **for**, and **while** must end with a colon (:). The colon tells Python that a new code block is about to begin.`,
      hint:        `Add a colon at the end of the ${m[1]} line.`,
      example:     m[1] === 'if'    ? 'if x > 5:\n    print(x)'
                 : m[1] === 'for'   ? 'for i in range(5):\n    print(i)'
                 : m[1] === 'while' ? 'while x > 0:\n    x -= 1'
                 : m[1] === 'def'   ? 'def greet(name):\n    print(name)'
                 : m[1] === 'class' ? 'class Dog:\n    pass'
                 : m[1] === 'else'  ? 'else:\n    print("done")'
                 : m[1] === 'elif'  ? 'elif x == 0:\n    print("zero")'
                 : `${m[1]}:\n    ...`,
    }),
  },

  // ── Unclosed bracket ─────────────────────────────────────────
  {
    test: /never closed.*matching '([)}\]])'/,
    build: (m, marker) => {
      const open  = { ')': '(', ']': '[', '}': '{' }[m[1]] ?? m[1]
      const names = { '(': 'parenthesis', '[': 'bracket', '{': 'brace' }
      const name  = names[open] ?? 'bracket'
      return {
        type:        'SyntaxError',
        title:       `Unclosed ${name}`,
        explanation: `You opened a ${name} **${open}** on line ${marker.startLineNumber} but never closed it with **${m[1]}**. Every opening bracket must have a matching closing bracket.`,
        hint:        `Add the closing **${m[1]}** where the expression ends.`,
        example:     name === 'parenthesis' ? 'print("hello")'
                   : name === 'bracket'     ? 'nums = [1, 2, 3]'
                   : 'data = {"key": "value"}',
      }
    },
  },

  // ── Unexpected closing bracket ───────────────────────────────
  {
    test: /unexpected closing (\w+) '([)}\]])'/,
    build: (m) => ({
      type:        'SyntaxError',
      title:       `Unexpected '${m[2]}'`,
      explanation: `There is a closing ${m[1]} **${m[2]}** that does not match any opening bracket. This usually means you either have an extra **${m[2]}** or you accidentally deleted the opening bracket.`,
      hint:        `Check that every opening bracket has exactly one matching closing bracket.`,
      example:     'result = (a + b) * c',
    }),
  },

  // ── Indentation error ────────────────────────────────────────
  {
    test: /IndentationError/i,
    build: () => ({
      type:        'IndentationError',
      title:       'Expected an indented block',
      explanation: 'Python uses **indentation** (spaces at the start of a line) to group code into blocks. After a line that ends with a colon — like **if**, **for**, **def** — the next line must be indented.',
      hint:        'Add 4 spaces (or press Tab) at the beginning of the line to move it inside the block.',
      example:     'if score >= 90:\n    grade = "A"\n    print(grade)',
    }),
  },

  // ── Undefined variable ───────────────────────────────────────
  {
    test: /'(\w+)' is not defined.*make sure you create/,
    build: (m) => ({
      type:        'NameError',
      title:       `'${m[1]}' is not defined`,
      explanation: `You are trying to use the variable **${m[1]}**, but Python cannot find it. This means it has not been created (assigned a value) before this line.`,
      hint:        `Create the variable by assigning it a value before you use it.`,
      example:     `${m[1]} = 0\nprint(${m[1]})`,
    }),
  },

  // ── Typo / Did you mean …? ──────────────────────────────────
  {
    test: /Did you mean '(\w+)'.*'(\w+)' is not a recognized/,
    build: (m) => ({
      type:        'Typo',
      title:       `Did you mean '${m[1]}'?`,
      explanation: `**${m[2]}** is not a known Python function or variable. It looks very similar to the built-in function **${m[1]}** — this is likely a typo.`,
      hint:        `Replace **${m[2]}** with **${m[1]}**.`,
      example:     m[1] === 'print' ? 'print("hello, world!")'
                 : m[1] === 'input' ? 'name = input("Enter name: ")'
                 : m[1] === 'len'   ? 'length = len([1, 2, 3])'
                 : m[1] === 'range' ? 'for i in range(5):'
                 : `${m[1]}(...)`,
    }),
  },
]

/**
 * Given an array of Monaco markers (from lintPython), return an array
 * of rich explanation objects.  Duplicate explanations (same type +
 * title) are collapsed so the panel stays concise.
 */
export function explainErrors(markers) {
  if (!markers || markers.length === 0) return []

  const seen = new Set()
  const explanations = []

  for (const marker of markers) {
    for (const rule of RULES) {
      const match = marker.message.match(rule.test)
      if (!match) continue

      const exp = rule.build(match, marker)
      exp.line = marker.startLineNumber

      const key = `${exp.type}:${exp.title}`
      if (seen.has(key)) break
      seen.add(key)

      explanations.push(exp)
      break
    }
  }

  return explanations
}
