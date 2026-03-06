import { useRef, useCallback, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { lintPython } from '../lib/pythonLinter'
import { explainErrors } from '../lib/errorExplainer'
import ErrorExplanation from './ErrorExplanation'

export const DEFAULT_CODE = `# Welcome to CodeVision!
# Edit this code, then click ▶ Run to visualize execution.

a = 5
b = a
a = 10
print(a, b)
`

const LINT_DELAY = 500

export default function CodeEditor({ code, onChange }) {
  const editorRef      = useRef(null)
  const monacoRef      = useRef(null)
  const decorationsRef = useRef([])
  const timerRef       = useRef(null)
  const prevHashRef    = useRef('')

  const [explanations, setExplanations] = useState([])

  const runLinter = useCallback((value) => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    const model = editor.getModel()
    if (!model) return

    const markers = lintPython(value)

    const hash = markers.map(m =>
      `${m.startLineNumber}:${m.startColumn}:${m.endColumn}:${m.severity}:${m.message}`
    ).join('|')

    if (hash === prevHashRef.current) return
    prevHashRef.current = hash

    monaco.editor.setModelMarkers(model, 'python-lint', markers)

    // Build rich explanations from the markers
    setExplanations(explainErrors(markers))

    const errorLines = [...new Set(
      markers.filter(m => m.severity === 8).map(m => m.startLineNumber)
    )]
    const warningLines = [...new Set(
      markers.filter(m => m.severity === 4).map(m => m.startLineNumber)
    )].filter(ln => !errorLines.includes(ln))

    const newDecorations = [
      ...errorLines.map(ln => ({
        range: new monaco.Range(ln, 1, ln, 1),
        options: {
          isWholeLine:          true,
          className:            'cv-error-line',
          glyphMarginClassName: 'cv-error-glyph',
        },
      })),
      ...warningLines.map(ln => ({
        range: new monaco.Range(ln, 1, ln, 1),
        options: {
          isWholeLine:          true,
          className:            'cv-warning-line',
          glyphMarginClassName: 'cv-warning-glyph',
        },
      })),
    ]

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current, newDecorations
    )
  }, [])

  const scheduleLint = useCallback((value) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runLinter(value), LINT_DELAY)
  }, [runLinter])

  useEffect(() => {
    if (editorRef.current) scheduleLint(code)
  }, [code, scheduleLint])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    scheduleLint(code)
  }

  const handleChange = (value) => {
    const v = value ?? ''
    onChange(v)
    scheduleLint(v)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[#1F2937] bg-[#0d1117] px-3 py-1.5 shrink-0">
        <div className="tab-item active flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>main.py</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-500 font-mono">
          {explanations.length > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {explanations.length}
            </span>
          )}
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span>Python 3 · Monaco</span>
        </div>
      </div>

      {/* Monaco Editor — takes remaining space above the explanation panel */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={handleChange}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            minimap:              { enabled: false },
            fontSize:             14,
            fontFamily:           '"JetBrains Mono", "Fira Code", Consolas, monospace',
            fontLigatures:        true,
            lineNumbers:          'on',
            lineNumbersMinChars:  3,
            scrollBeyondLastLine: false,
            automaticLayout:      true,
            padding:              { top: 14, bottom: 14 },
            renderLineHighlight:  'gutter',
            cursorBlinking:       'smooth',
            smoothScrolling:      true,
            wordWrap:             'on',
            tabSize:              4,
            insertSpaces:         true,
            glyphMargin:          true,
          }}
        />
      </div>

      {/* Error Explanation panel — slides in when there are issues */}
      <ErrorExplanation explanations={explanations} />
    </div>
  )
}
