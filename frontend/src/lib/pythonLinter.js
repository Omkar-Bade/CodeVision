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

// Valid Python string prefixes immediately before ' or " (case-insensitive).
// Covers: f/F, r/R, b/B, u/U, fr/Fr/fR/FR, rf/rF/Rf/RF, br/Br/bR/BR, rb/rB/Rb/RB.
const STRING_PREFIX_RE = /^(?:[fF][rR]?|[rR](?:[fF]|[bB])?|[bB][rR]?|[uU])/

function isFStringPrefix(prefix) {
  return /[fF]/.test(prefix)
}

/**
 * If `text[pos]` begins a Python string literal (optional prefix + quote),
 * return { end, isFString }. Otherwise return null.
 * Skips literal content; does not modify text.
 */
function skipStringLiteral(text, pos) {
  const prefixMatch = text.slice(pos).match(STRING_PREFIX_RE)
  const prefixLen = prefixMatch ? prefixMatch[0].length : 0
  const quotePos = pos + prefixLen
  const quote = text[quotePos]

  if (quote !== '"' && quote !== "'") return null

  const prefix = prefixMatch ? prefixMatch[0] : ''
  const isTriple = text.slice(quotePos + 1, quotePos + 3) === quote + quote
  const marker = isTriple ? quote.repeat(3) : quote
  let i = quotePos + marker.length

  while (i < text.length) {
    if (text.startsWith(marker, i)) {
      return { end: i + marker.length, isFString: isFStringPrefix(prefix) }
    }

    if (isFStringPrefix(prefix) && text[i] === '{') {
      if (text[i + 1] === '{') {
        i += 2
        continue
      }
      i = skipFStringExpressionEnd(text, i)
      continue
    }

    if (text[i] === '\\') {
      i += 2
      continue
    }

    i++
  }

  return { end: text.length, isFString: isFStringPrefix(prefix) }
}

/** Advance past a `{expr}` f-string replacement field; `pos` points at `{`. */
function skipFStringExpressionEnd(text, pos) {
  let i = pos + 1
  let depth = 1

  while (i < text.length && depth > 0) {
    const skipped = skipStringLiteral(text, i)
    if (skipped) {
      i = skipped.end
      continue
    }

    const ch = text[i]
    if (ch === '{') depth++
    else if (ch === '}') depth--
    i++
  }

  return i
}

/**
 * Replace string literals with safe placeholders for identifier scanning.
 * The output has the SAME LENGTH as the input — every character position maps
 * 1:1 to the original.  Non-f-string content is replaced with spaces.
 * F-string `{expr}` bodies are preserved at their original offsets so
 * undefined names inside them are still checked; all other characters
 * (prefix letters, quotes, literal text) become spaces.
 */
function maskStringsForLint(text) {
  const chars = text.split('')
  let i = 0

  while (i < text.length) {
    const skipped = skipStringLiteral(text, i)
    if (skipped) {
      if (skipped.isFString) {
        maskFStringLiteral(text, chars, i, skipped.end)
      } else {
        // Blank out the entire non-f-string literal
        for (let j = i; j < skipped.end; j++) {
          chars[j] = text[j] === '\n' ? '\n' : ' '
        }
      }
      i = skipped.end
    } else {
      i++
    }
  }

  return chars.join('')
}

/**
 * In-place mask an f-string spanning [start, end) in the `chars` array.
 * Blanks prefix, quotes, and literal text; preserves `{expr}` bodies.
 * Escaped braces `{{` / `}}` are blanked (they're literal characters).
 */
function maskFStringLiteral(text, chars, start, end) {
  const prefixMatch = text.slice(start).match(STRING_PREFIX_RE)
  const prefixLen = prefixMatch ? prefixMatch[0].length : 0
  const quotePos = start + prefixLen
  const quote = text[quotePos]
  const isTriple = text.slice(quotePos + 1, quotePos + 3) === quote + quote
  const marker = isTriple ? quote.repeat(3) : quote

  // Blank prefix + opening quote
  for (let j = start; j < quotePos + marker.length; j++) {
    chars[j] = ' '
  }

  let i = quotePos + marker.length

  while (i < end) {
    // Closing quote
    if (text.startsWith(marker, i)) {
      for (let j = i; j < i + marker.length && j < end; j++) {
        chars[j] = ' '
      }
      break
    }

    if (text[i] === '{') {
      // Escaped brace {{ → blank both
      if (text[i + 1] === '{') {
        chars[i] = ' '
        chars[i + 1] = ' '
        i += 2
        continue
      }

      // Expression body — blank the { and }, keep expression content
      // but also blank any string literals inside the expression
      const exprEnd = skipFStringExpressionEnd(text, i)
      chars[i] = ' '                    // blank opening {
      if (exprEnd - 1 < end) chars[exprEnd - 1] = ' '  // blank closing }

      // Mask string literals within the expression body
      let ei = i + 1
      while (ei < exprEnd - 1) {
        const innerStr = skipStringLiteral(text, ei)
        if (innerStr) {
          for (let j = ei; j < innerStr.end; j++) {
            chars[j] = text[j] === '\n' ? '\n' : ' '
          }
          ei = innerStr.end
        } else {
          ei++
        }
      }

      i = exprEnd
      continue
    }

    // Escaped literal brace }}
    if (text[i] === '}' && i + 1 < end && text[i + 1] === '}') {
      chars[i] = ' '
      chars[i + 1] = ' '
      i += 2
      continue
    }

    // Backslash escape
    if (text[i] === '\\') {
      chars[i] = ' '
      if (i + 1 < end) chars[i + 1] = text[i + 1] === '\n' ? '\n' : ' '
      i += 2
      continue
    }

    // Regular literal text — blank it (preserve newlines for line counting)
    chars[i] = text[i] === '\n' ? '\n' : ' '
    i++
  }
}

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
  for (let i = 0; i < line.length; i++) {
    const skipped = skipStringLiteral(line, i)
    if (skipped) {
      i = skipped.end - 1
      continue
    }
    if (line[i] === '#') return line.slice(0, i)
  }
  return line
}

// ── Position utilities ───────────────────────────────────────────

/** Build an array where entry i is the character offset of line i (0-indexed). */
function buildLineStarts(code) {
  const starts = [0]
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '\n') starts.push(i + 1)
  }
  return starts
}

/** Convert a character offset into { line, col } (both 1-indexed, Monaco style). */
function posAtOffset(lineStarts, offset) {
  // Binary search for the line containing `offset`.
  let lo = 0, hi = lineStarts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    if (lineStarts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return { line: lo + 1, col: offset - lineStarts[lo] + 1 }
}

// ── Identifier scanning helpers ─────────────────────────────────

/**
 * Walk `text` extracting identifier tokens and emitting lint markers for
 * any that are neither defined nor a keyword.  `baseOffset` maps positions
 * in `text` back to the original `code` string so we can compute correct
 * line / column via `lineStarts`.
 */
function scanIdentifierTokens(text, baseOffset, code, lineStarts, defined, add) {
  const ID_RE = /[a-zA-Z_]\w*/g
  let m

  while ((m = ID_RE.exec(text)) !== null) {
    const name = m[0]
    const posInText = m.index

    // Skip Python keywords
    if (PY_KEYWORDS.has(name)) continue

    // Skip if preceded by '.' — this is an attribute access (e.g. name.upper)
    if (posInText > 0 && text[posInText - 1] === '.') continue

    // Skip conversion flags: !r, !s, !a  (the single char after '!')
    if (posInText > 0 && text[posInText - 1] === '!' &&
        (name === 'r' || name === 's' || name === 'a')) continue

    // Skip identifiers that appear as part of a format spec (after ':').
    // e.g. f"{pi:.2f}" — the 'f' after '.2' is a format type, not a variable.
    // We detect this by checking if between the last '{' or '!' and this token
    // there is a ':' that isn't inside nested braces.
    if (isInsideFormatSpec(text, posInText)) continue

    // Already defined or a builtin — OK
    if (defined.has(name)) continue

    // Check for typos
    if (TYPO_MAP[name]) {
      const absOffset = baseOffset + posInText
      const { line, col } = posAtOffset(lineStarts, absOffset)
      add(line, col, col + name.length,
        `Did you mean '${TYPO_MAP[name]}'? '${name}' is not a recognized Python name`,
        4 /* Warning */)
      continue
    }

    // Undefined variable
    const absOffset = baseOffset + posInText
    const { line, col } = posAtOffset(lineStarts, absOffset)
    add(line, col, col + name.length,
      `NameError: '${name}' is not defined — make sure you create it before using it`)
  }
}

/**
 * Heuristic: returns true if position `pos` in `text` falls inside a format
 * specifier (the part after ':' inside an f-string {expr:spec}).
 *
 * Walks backward from `pos` looking for an unbalanced ':' that isn't inside
 * brackets/parens (which would indicate a slice or dict literal, not a
 * format spec).
 */
function isInsideFormatSpec(text, pos) {
  let depth = 0
  for (let i = pos - 1; i >= 0; i--) {
    const ch = text[i]
    if (ch === ')' || ch === ']') depth++
    else if (ch === '(' || ch === '[') depth--
    else if (ch === '}' || ch === '{') break   // hit expression boundary
    else if (ch === ':' && depth === 0) return true
  }
  return false
}

/**
 * Scan expression bodies inside an f-string spanning [start, end) in `code`
 * for undefined variable references.
 */
function scanFStringLiteralExpressions(code, start, end, lineStarts, defined, add) {
  const prefixMatch = code.slice(start).match(STRING_PREFIX_RE)
  const prefixLen = prefixMatch ? prefixMatch[0].length : 0
  const quotePos = start + prefixLen
  const quote = code[quotePos]
  const isTriple = code.slice(quotePos + 1, quotePos + 3) === quote + quote
  const marker = isTriple ? quote.repeat(3) : quote

  let i = quotePos + marker.length

  while (i < end) {
    if (code.startsWith(marker, i)) break

    if (code[i] === '{') {
      // Escaped brace {{ — skip
      if (code[i + 1] === '{') {
        i += 2
        continue
      }

      // Find the end of the expression (balanced braces)
      const exprEnd = skipFStringExpressionEnd(code, i)
      // The expression body is between { and }
      const exprBody = code.slice(i + 1, exprEnd - 1)

      // Strip conversion flag (!r, !s, !a) and format spec (:...) from the
      // expression body before scanning.  We need to find the top-level !
      // or : that separates the expression from the conversion / format spec.
      const cleanExpr = stripConversionAndFormatSpec(exprBody)
      const masked = maskStringsForLint(cleanExpr)
      scanIdentifierTokens(masked, i + 1, code, lineStarts, defined, add)

      i = exprEnd
      continue
    }

    if (code[i] === '\\') {
      i += 2
      continue
    }

    i++
  }
}

/**
 * Given an f-string expression body (contents between { and }),
 * strip the trailing conversion flag (!r/!s/!a) and format spec (:...)
 * so that only the actual expression remains for identifier scanning.
 *
 * e.g. "pi:.2f" → "pi"
 *      "name!r" → "name"
 *      "b + c"  → "b + c"
 */
function stripConversionAndFormatSpec(expr) {
  let depth = 0

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]

    // Skip nested string literals
    const skipped = skipStringLiteral(expr, i)
    if (skipped) {
      i = skipped.end - 1
      continue
    }

    if (ch === '(' || ch === '[' || ch === '{') depth++
    else if (ch === ')' || ch === ']' || ch === '}') depth--
    else if (depth === 0) {
      // Top-level '!' followed by r/s/a and then end-of-expr or ':'
      if (ch === '!' && i + 1 < expr.length && 'rsaRSA'.includes(expr[i + 1])) {
        const after = i + 2
        if (after >= expr.length || expr[after] === ':') {
          return expr.slice(0, i)
        }
      }
      // Top-level ':' is a format spec separator
      if (ch === ':') {
        return expr.slice(0, i)
      }
    }
  }

  return expr
}

// ── 1. Bracket matching ──────────────────────────────────────────

function checkBrackets(lines, lastNonEmpty, add) {
  const code = lines.join('\n')
  const lineStarts = buildLineStarts(code)
  const stack = []

  for (let i = 0; i < code.length; i++) {
    const skipped = skipStringLiteral(code, i)
    if (skipped) {
      i = skipped.end - 1
      continue
    }

    const ch = code[i]
    if (ch === '#') {
      const nl = code.indexOf('\n', i)
      i = nl === -1 ? code.length - 1 : nl
      continue
    }
    if (ch === '\n') continue

    const { line, col } = posAtOffset(lineStarts, i)

    if (BRACKET_PAIRS[ch]) {
      stack.push({ char: ch, line: line - 1, col: col - 1 })
    } else if (CLOSE_TO_OPEN[ch]) {
      if (stack.length === 0 || stack[stack.length - 1].char !== CLOSE_TO_OPEN[ch]) {
        add(line, col, col + 1,
          `SyntaxError: unexpected closing ${BRACKET_NAME[ch]} '${ch}' — check for a matching opening ${BRACKET_NAME[ch]}`)
      } else {
        stack.pop()
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

  // Pass 2 — flag used-but-not-defined identifiers (file-level for multi-line strings)
  scanIdentifiersInFile(lines, defined, add)
}

function scanIdentifiersInFile(lines, defined, add) {
  const code = lines.join('\n')
  const lineStarts = buildLineStarts(code)

  // Mask all string literals in one pass.  maskStringsForLint already handles
  // f-strings: it replaces non-f-strings with "", and for f-strings it
  // preserves {expr} bodies while blanking literal text.  This eliminates
  // the multi-line string detection problem entirely.
  const masked = maskStringsForLint(code)

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineStart = lineStarts[lineIdx]
    const lineEnd = lineIdx + 1 < lineStarts.length
      ? lineStarts[lineIdx + 1] - 1   // exclude the \n
      : code.length

    const lineText = code.slice(lineStart, lineEnd)
    const maskedLine = masked.slice(lineStart, lineEnd)
    const trimmed = lineText.trimStart()

    if (!trimmed || trimmed.startsWith('#')) continue
    if (/^(import|from|def|class)\b/.test(trimmed)) continue

    // For assignment lines, only scan the RHS
    const assignMatch = trimmed.match(/^[a-zA-Z_][\w]*(?:\s*,\s*[a-zA-Z_][\w]*)*\s*[+\-*/%]?=(?!=)/)
    if (assignMatch) {
      const eqIdx = lineText.indexOf('=')
      if (eqIdx !== -1) {
        // Skip compound-assignment operators like +=, -=, etc.
        const eqAbsIdx = lineStart + eqIdx
        const rhsMasked = maskedLine.slice(eqIdx + 1)
        scanIdentifierTokens(rhsMasked, eqAbsIdx + 1, code, lineStarts, defined, add)
        continue
      }
    }

    // Strip comments from the masked line before scanning
    let scanEnd = maskedLine.length
    const commentIdx = maskedLine.indexOf('#')
    if (commentIdx !== -1) scanEnd = commentIdx

    const scanText = maskedLine.slice(0, scanEnd)
    scanIdentifierTokens(scanText, lineStart, code, lineStarts, defined, add)
  }
}
