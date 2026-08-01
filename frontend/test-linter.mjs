import { lintPython } from './src/lib/pythonLinter.js'

function test(name, code, expectErrors = []) {
  const markers = lintPython(code)
  const nameErrors = markers.filter(m => /NameError|not defined|not a recognized/.test(m.message))
  const names = nameErrors.map(m => m.message.match(/'(\w+)'/)?.[1]).filter(Boolean)

  const pass = expectErrors.length === 0
    ? nameErrors.length === 0
    : expectErrors.every(e => names.includes(e)) && names.length === expectErrors.length

  console.log(`${pass ? 'PASS' : 'FAIL'}: ${name}`)
  if (!pass) {
    console.log('  Expected name errors:', expectErrors.length ? expectErrors : '(none)')
    console.log('  Got:', names.length ? names : '(none)')
    console.log('  All markers:', markers.map(m => m.message))
  }
}

test('basic f-string', 'a = 5\nprint(f"{a}")')
test('f-string expr', 'b, c = 2, 3\nprint(f"{b + c}")')
test('f-string method', 'name = "omkar"\nprint(f"{name.upper()}")')
test('escaped braces', 'a = 5\nprint(f"{{literal}} {a}")')
test('multi-line f-string', 'a = 5\nprint(f"""\nValue: {a}\n""")')
test('capital F', 'a = 5\nprint(F"{a}")')
test('rf prefix', 'a = 5\nprint(rf"{a}\\n")')

test('plain double quote', 'x = "hello"\nprint(x)')
test('plain single quote', "x = 'hello'\nprint(x)")

test('undefined in f-string', 'print(f"{undefined_var}")', ['undefined_var'])
test('undefined bare', 'print(undefined_var)', ['undefined_var'])
test('f not flagged when prefix', 'a = 1\nprint(f"{a}")', [])
