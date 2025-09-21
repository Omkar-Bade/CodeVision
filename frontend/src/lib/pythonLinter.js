/**
 * pythonLinter.js
 *
 * Lightweight, client-side Python linter that produces Monaco-compatible
 * diagnostics.  Designed for beginners — error messages are friendly and
 * the analysis is tolerant of incomplete lines (the cursor line) to avoid
 * false positives while the user is still typing.
 *
 * Checks:
 *   1. Unmatched parentheses / brackets / braces
 *   2. Missing colon after if / elif / else / for / while / def / class
 *   3. Indentation errors (expected indent after a colon-block header)
 *   4. Undefined variable usage (simple single-scope analysis)
 *   5. Misspelled built-in function names
 *
 * Returns an array of marker objects for monaco.editor.setModelMarkers().
 */

// ── Python built-in names the linter considers "always defined" ──────
const BUILTINS = new Set([
  'print', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict',
  'set', 'tuple', 'type', 'input', 'abs', 'max', 'min', 'sum', 'sorted',
  'reversed', 'enumerate', 'zip', 'map', 'filter', 'any', 'all', 'open',
  'round', 'pow', 'isinstance', 'issubclass', 'hasattr', 'getattr', 'setattr',
  'id', 'hex', 'oct', 'bin', 'chr', 'ord', 'repr', 'hash', 'format',
  'super', 'object', 'property', 'staticmethod', 'classmethod',
  'True', 'False', 'None', 'Exception', 'ValueError', 'TypeError',
  'KeyError', 'IndexError', 'AttributeError', 'RuntimeError',
  'StopIteration', 'ZeroDivisionError', 'FileNotFoundError',
  'ImportError', 'NameError', 'NotImplementedError', 'OverflowError',
  '__name__', '__file__', '_',
])

const TYPO_MAP = {
  pritn: 'print', prnt: 'print', pirnt: 'print', ptint: 'print',
  prnit: 'print', prtin: 'print', printt: 'print', prit: 'print',
  inut: 'input', inpt: 'input', ipnut: 'input',
  lne: 'len', eln: 'len',
  ragne: 'range', rnage: 'range',
  retrun: 'return', reutrn: 'return', retrn: 'return', retunr: 'return',
  flase: 'False', ture: 'True', treu: 'True',
  NOen: 'None', noen: 'None', nOne: 'None',
}

const BRACKET_PAIRS = { '(': ')', '[': ']', '{': '}' }
const CLOSE_TO_OPEN = { ')': '(', ']': '[', '}': '{' }
const BRACKET_NAME  = {
  '(': 'parenthesis', ')': 'parenthesis',
  '[': 'bracket',     ']': 'bracket',
  '{': 'brace',       '}': 'brace',
}

const COLON_KEYWORDS = /^(if|elif|else|for|while|def|class|try|except|finally|with)\b/

const PY_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
  'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
  'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'True', 'False', 'None',
])

/**
 * Analyse `code` and return an array of Monaco marker descriptors.
 *
 * Severity values (matches MonacoEditor.MarkerSeverity):
 *   8 = Error, 4 = Warning, 2 = Info, 1 = Hint
 */
export function lintPython(code) {
  if (!code || !code.trim()) return []

  const lines   = code.split('\n')
  const markers = []

  // Determine which line is "incomplete" — the last non-empty line in the
  // file.  We treat it more leniently because the user is likely still
  // typing there.  This prevents false bracket / colon errors that would
  // flicker while code is being written.
  const lastNonEmpty = findLastNonEmptyLine(lines)

  const add = (line, colStart, colEnd, message, severity = 8) => {
    markers.push({
      startLineNumber: line,
      startColumn:     Math.max(1, colStart),
      endLineNumber:   line,
      endColumn:       Math.max(colStart + 1, colEnd),
      message,
      severity,
    })
  }

  checkBrackets(lines, lastNonEmpty, add)
  checkMissingColons(lines, lastNonEmpty, add)
  checkIndentation(lines, lastNonEmpty, add)
  checkVariables(lines, add)

  return markers
}

// ── Helpers ───────────────────────────────────────────────────────

function findLastNonEmptyLine(lines) {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim()) return i  // 0-based index
  }
  return 0
}

function indentLevel(line) {
  const m = line.match(/^(\s*)/)
  return m ? m[1].replace(/\t/g, '    ').length : 0
}

function stripTrailingComment(line) {
  let inStr = null
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inStr) { if (ch === inStr && line[i - 1] !== '\\') inStr = null; continue }
    if (ch === '"' || ch === "'") { inStr = ch; continue }
    if (ch === '#') return line.slice(0, i)
  }
  return line
}

// ── 1. Bracket matching ──────────────────────────────────────────

function checkBrackets(lines, lastNonEmpty, add) {
  const stack = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let inStr = null
    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (inStr) {
        if (ch === inStr && (j === 0 || line[j - 1] !== '\\')) inStr = null
        continue
      }
      if (ch === '#') break
      if (ch === '"' || ch === "'") { inStr = ch; continue }

      if (BRACKET_PAIRS[ch]) {
        stack.push({ char: ch, line: i, col: j })
      } else if (CLOSE_TO_OPEN[ch]) {
        if (stack.length === 0 || stack[stack.length - 1].char !== CLOSE_TO_OPEN[ch]) {
          add(i + 1, j + 1, j + 2,
            `SyntaxError: unexpected closing ${BRACKET_NAME[ch]} '${ch}' — check for a matching opening ${BRACKET_NAME[ch]}`)
        } else {
          stack.pop()
        }
      }
    }
  }

  for (const item of stack) {
    // If the unmatched open bracket is on the last non-empty line, the
    // user is probably still typing — skip it to avoid flickering.
    if (item.line === lastNonEmpty) continue

    add(item.line + 1, item.col + 1, item.col + 2,
      `SyntaxError: this '${item.char}' is never closed — add a matching '${BRACKET_PAIRS[item.char]}'`)
  }
}

// ── 2. Missing colon ────────────────────────────────────────────

function checkMissingColons(lines, lastNonEmpty, add) {
  for (let i = 0; i < lines.length; i++) {
    // Don't flag the line the user is currently editing
    if (i === lastNonEmpty) continue

    const trimmed = lines[i].trimStart()
    if (!trimmed || trimmed.startsWith('#')) continue

    const kwMatch = trimmed.match(COLON_KEYWORDS)
    if (!kwMatch) continue

    const keyword = kwMatch[1]
    const noComment = stripTrailingComment(trimmed)
    if (!noComment.trimEnd().endsWith(':')) {
      if (/[(\[{]\s*$/.test(noComment)) continue   // multi-line expression

      const col = lines[i].indexOf(keyword) + 1
      add(i + 1, col, col + keyword.length,
        `SyntaxError: expected ':' at the end of the '${keyword}' statement — add a colon after the condition`)
    }
  }
}

// ── 3. Indentation errors ───────────────────────────────────────

function checkIndentation(lines, lastNonEmpty, add) {
  for (let i = 0; i < lines.length - 1; i++) {
    const trimmed = lines[i].trimStart()
    if (!trimmed || trimmed.startsWith('#')) continue

    const noComment = stripTrailingComment(trimmed)
    if (!noComment.trimEnd().endsWith(':')) continue

    const currentIndent = indentLevel(lines[i])
    let checked = false
    for (let j = i + 1; j < lines.length; j++) {
      const nextTrimmed = lines[j].trimStart()
      if (!nextTrimmed || nextTrimmed.startsWith('#')) continue

      checked = true
      if (indentLevel(lines[j]) <= currentIndent) {
        // Don't flag if the non-indented line is the one the user is on
        if (j === lastNonEmpty) break
        add(j + 1, 1, (lines[j]?.length ?? 0) + 1,
          'IndentationError: this line should be indented — add spaces at the start to place it inside the block above')
      }
      break
    }
    // If the colon line is the last line, user is still typing the block
    if (!checked) continue
  }
}

// ── 4. Variable usage analysis ──────────────────────────────────

function checkVariables(lines, add) {
  const defined = new Set(BUILTINS)

  // Pass 1 — gather all definitions across the entire file
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart()
    if (!trimmed || trimmed.startsWith('#')) continue

    const assignMatch = trimmed.match(/^([a-zA-Z_][\w]*(?:\s*,\s*[a-zA-Z_][\w]*)*)\s*[+\-*/%]?=(?!=)/)
    if (assignMatch) assignMatch[1].split(',').forEach(v => defined.add(v.trim()))

    const forMatch = trimmed.match(/^for\s+([a-zA-Z_][\w]*(?:\s*,\s*[a-zA-Z_][\w]*)*)\s+in\b/)
    if (forMatch) forMatch[1].split(',').forEach(v => defined.add(v.trim()))

    const defMatch = trimmed.match(/^(?:def|class)\s+([a-zA-Z_]\w*)/)
    if (defMatch) defined.add(defMatch[1])

    const importMatch = trimmed.match(/^(?:from\s+\S+\s+)?import\s+(.+)/)
    if (importMatch) {
      importMatch[1].split(',').forEach(part => {
        const asMatch = part.trim().match(/(?:.*\s+as\s+)?(\w+)$/)
        if (asMatch) defined.add(asMatch[1])
      })
    }

    const paramMatch = trimmed.match(/^def\s+\w+\s*\(([^)]*)\)/)
    if (paramMatch) {
      paramMatch[1].split(',').forEach(p => {
        const name = p.trim().split('=')[0].split(':')[0].trim()
        if (name && /^[a-zA-Z_]/.test(name)) defined.add(name)
      })
    }

    // with ... as x:
    const withMatch = trimmed.match(/\bas\s+([a-zA-Z_]\w*)/)
    if (withMatch && /^with\b/.test(trimmed)) defined.add(withMatch[1])

    // list / dict / set comprehension variables  [x for x in ...]
    const compMatch = trimmed.match(/\bfor\s+([a-zA-Z_]\w*)\s+in\b/)
    if (compMatch) defined.add(compMatch[1])
  }

  // Pass 2 — flag used-but-not-defined identifiers
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart()
    if (!trimmed || trimmed.startsWith('#')) continue

    if (/^[a-zA-Z_][\w]*\s*[+\-*/%]?=(?!=)/.test(trimmed)) {
      const rhs = trimmed.replace(/^[^=]+=\s*/, '')
      scanIdentifiers(rhs, i, lines[i], defined, add)
      continue
    }
    if (/^(import|from|def|class)\b/.test(trimmed)) continue

    scanIdentifiers(trimmed, i, lines[i], defined, add)
  }
}

function scanIdentifiers(text, lineIdx, fullLine, defined, add) {
  const stripped = text.replace(/#.*$/, '').replace(/(["'])(?:(?!\1|\\).|\\.)*\1/g, '""')
  const idRe = /\b([a-zA-Z_]\w*)\b/g
  let m
  while ((m = idRe.exec(stripped)) !== null) {
    const name = m[1]
    if (PY_KEYWORDS.has(name)) continue
    if (defined.has(name)) continue
    if (m.index > 0 && stripped[m.index - 1] === '.') continue

    // Find the actual column in the full source line
    const searchFrom = fullLine.length - fullLine.trimStart().length
    const col = fullLine.indexOf(name, searchFrom) + 1
    if (col <= 0) continue

    const suggestion = TYPO_MAP[name]
    if (suggestion) {
      add(lineIdx + 1, col, col + name.length,
        `Did you mean '${suggestion}'? — '${name}' is not a recognized name`, 4)
    } else {
      add(lineIdx + 1, col, col + name.length,
        `NameError: '${name}' is not defined — make sure you create this variable before using it`, 8)
    }
  }
}
