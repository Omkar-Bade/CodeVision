/**
 * Standalone test for pythonLinter.js f-string handling.
 *
 * Run with:  node pythonLinter.test.mjs
 * (from the frontend directory)
 */

import { lintPython } from './src/lib/pythonLinter.js'

let passed = 0
let failed = 0

function test(name, code, expectErrors, expectUndefined) {
  // expectErrors: number of expected lint errors (0 for valid code)
  // expectUndefined: if set, array of variable names that SHOULD be flagged
  const markers = lintPython(code)
  const errors = markers.filter(m => m.severity === 8) // severity 8 = Error

  let ok = true
  let reason = ''

  if (expectUndefined) {
    // Check that the expected undefined vars are flagged
    for (const varName of expectUndefined) {
      const found = errors.some(m => m.message.includes(`'${varName}' is not defined`))
      if (!found) {
        ok = false
        reason += `  Expected '${varName}' to be flagged as undefined but it was not.\n`
      }
    }
    // Check that no OTHER false positives exist beyond the expected ones
    for (const m of errors) {
      const match = m.message.match(/'(\w+)' is not defined/)
      if (match && !expectUndefined.includes(match[1])) {
        ok = false
        reason += `  Unexpected false positive: ${m.message}\n`
      }
    }
  } else {
    if (errors.length !== expectErrors) {
      ok = false
      reason = `  Expected ${expectErrors} error(s) but got ${errors.length}:\n`
      for (const m of errors) {
        reason += `    Line ${m.startLineNumber}: ${m.message}\n`
      }
    }
  }

  if (ok) {
    console.log(`  ✅ ${name}`)
    passed++
  } else {
    console.log(`  ❌ ${name}`)
    console.log(reason)
    failed++
  }
}

// ═══════════════════════════════════════════════════════════════════
//  F-STRING TEST SUITE (all must pass with zero false lint errors)
// ═══════════════════════════════════════════════════════════════════

console.log('\n── F-String Test Suite ──────────────────────────────────')

test('1. Basic f-string interpolation',
  'a = 5\nprint(f"{a}")',
  0)

test('2. Expression inside braces',
  'b, c = 2, 3\nprint(f"{b + c}")',
  0)

test('3. Method call inside braces',
  'name = "omkar"\nprint(f"{name.upper()}")',
  0)

test('4. Escaped/literal braces',
  'a = 5\nprint(f"{{literal}} {a}")',
  0)

test('5. Multi-line triple-quoted f-string',
  'a = 5\nprint(f"""\nValue: {a}\n""")',
  0)

test('6. Capital F prefix',
  'a = 5\nprint(F"{a}")',
  0)

test('7. Raw f-string (rf prefix)',
  'a = 5\nprint(rf"{a}\\n")',
  0)

test('8. Format specifier',
  'pi = 3.14159\nprint(f"{pi:.2f}")',
  0)

test('9. Conversion flag !r',
  'name = "omkar"\nprint(f"{name!r}")',
  0)

test('10. Nested quotes inside f-string expression',
  'a = 5\nprint(f"{ \'yes\' if a > 0 else \'no\' }")',
  0)

// ═══════════════════════════════════════════════════════════════════
//  REGRESSION CHECKS (must NOT break after the fix)
// ═══════════════════════════════════════════════════════════════════

console.log('\n── Regression Checks ───────────────────────────────────')

test('R1. Plain strings without prefix',
  'x = "hello"\ny = \'world\'\nz = """multi"""\nprint(x, y, z)',
  0)

test('R2. Genuinely undefined var inside f-string',
  'print(f"{undefined_var}")',
  null,
  ['undefined_var'])

test('R3. Other prefix strings (r, b, rb)',
  'print(r"C:\\\\path\\\\no\\\\escape")\nprint(b"bytes literal")\nprint(rb"raw bytes")',
  0)

test('R4. Regular multi-line triple-quoted string',
  'print("""\nplain multi-line string, no {braces} parsing needed here\n""")',
  0)

test('R5. f is not flagged as undefined',
  'a = 5\nprint(f"{a}")',
  null,
  [])  // Specifically: NO variable named 'f' should be flagged

// ═══════════════════════════════════════════════════════════════════
//  SUMMARY
// ═══════════════════════════════════════════════════════════════════

console.log('\n────────────────────────────────────────────────────────')
console.log(`  Total: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`)
console.log('────────────────────────────────────────────────────────\n')

process.exit(failed > 0 ? 1 : 0)
