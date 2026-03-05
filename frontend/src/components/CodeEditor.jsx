import Editor from '@monaco-editor/react'

export const DEFAULT_CODE = `# Welcome to CodeVision!
# Edit this code, then click ▶ Run to visualize execution.

a = 5
b = a
a = 10
print(a, b)
`

export default function CodeEditor({ code, onChange }) {
  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center border-b border-slate-800/80 bg-slate-900/70 px-3 py-1.5">
        <div className="tab-item active flex items-center gap-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-vs-green animate-pulse" />
          <span>main.py</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="h-2 w-2 rounded-full bg-cyan-400/80" />
          <span>Python 3 · Monaco</span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={v => onChange(v ?? '')}
          theme="vs-dark"
          options={{
            minimap:              { enabled: false },
            fontSize:             14,
            fontFamily:           '"Fira Code", Consolas, monospace',
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
          }}
        />
      </div>
    </div>
  )
}
