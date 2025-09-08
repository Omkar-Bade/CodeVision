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
      <div className="flex items-center bg-[#2d2d2d] border-b border-vs-border">
        <div className="tab-item active flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-vs-blue" />
          main.py
        </div>
        <div className="ml-auto flex items-center gap-2 px-3">
          <span className="text-xs text-gray-500 font-mono">Python 3</span>
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
