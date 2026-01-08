/**
 * InteractiveConsole.jsx
 *
 * A terminal-style React component that connects to the WS /ws/execute
 * WebSocket endpoint for live, interactive code execution.
 *
 * Features:
 *   - Real-time stdout streaming (output appears as it's printed)
 *   - Interactive input() — shows prompt, user types inline, Enter sends
 *   - Auto-scrolls to latest output
 *   - Run / Stop controls
 *   - Graceful handling of done, error, timeout, and disconnect
 *
 * Props:
 *   code      (string)  — current editor code to execute
 *   isActive  (boolean) — true when the interactive console mode is selected
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── WebSocket URL builder (production-safe) ──────────────────────────────────
// Uses the current page's origin so it works on both localhost and Render.
function getWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/execute`
}

// ── Line types for rendering ─────────────────────────────────────────────────
// Each console line has a type that determines its color and style.
// 'output'  — green,  stdout text
// 'input'   — cyan,   echoed user input
// 'prompt'  — yellow, input() prompt text
// 'info'    — gray,   system messages (done, connecting)
// 'error'   — red,    error messages
function lineClass(type) {
  switch (type) {
    case 'output':  return 'text-green-400'
    case 'input':   return 'text-cyan-300'
    case 'prompt':  return 'text-yellow-300'
    case 'info':    return 'text-gray-500'
    case 'error':   return 'text-red-400'
    default:        return 'text-gray-300'
  }
}

export default function InteractiveConsole({ code, isActive }) {
  // ── State ──────────────────────────────────────────────────────────────────
  // lines       — array of { id, type, text } for the console display
  // status      — 'idle' | 'connecting' | 'running' | 'waiting_input' | 'done' | 'error'
  // inputText   — current value of the inline input field
  const [lines, setLines] = useState([])
  const [status, setStatus] = useState('idle')
  const [inputText, setInputText] = useState('')

  // Refs for WebSocket, auto-scroll container, input field, and line ID counter
  const wsRef = useRef(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const lineIdRef = useRef(0)

  // ── Auto-scroll to bottom on new output ────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [lines])

  // ── Focus the input field when waiting for input ───────────────────────────
  useEffect(() => {
    if (status === 'waiting_input' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [status])

  // ── Cleanup WebSocket on unmount or mode switch ────────────────────────────
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState <= 1) {
        wsRef.current.close()
      }
    }
  }, [])

  // ── Helper: add a line to the console ──────────────────────────────────────
  const addLine = useCallback((type, text) => {
    lineIdRef.current += 1
    setLines(prev => [...prev, { id: lineIdRef.current, type, text }])
  }, [])

  // ── Run handler — connect WS and send code ─────────────────────────────────
  const handleRun = useCallback(() => {
    if (!code.trim()) return

    // Reset console
    setLines([])
    setStatus('connecting')
    setInputText('')
    lineIdRef.current = 0

    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('running')
      addLine('info', '▶ Execution started…')
      ws.send(JSON.stringify({ type: 'run', code }))
    }

    ws.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      switch (msg.type) {
        case 'output':
          // Split on newlines so each line renders separately (preserves multi-line prints)
          if (msg.text) {
            const parts = msg.text.split('\n')
            // If the text ends with \n, the last element is '' — don't add an empty line
            parts.forEach((part, i) => {
              if (i < parts.length - 1) {
                addLine('output', part)
              } else if (part) {
                // Last segment without trailing newline — partial line
                addLine('output', part)
              }
            })
          }
          break

        case 'input_request':
          setStatus('waiting_input')
          break

        case 'done':
          addLine('info', '✓ Execution finished')
          setStatus('done')
          ws.close()
          break

        case 'error':
          addLine('error', `✕ ${msg.message}`)
          setStatus('error')
          ws.close()
          break

        default:
          break
      }
    }

    ws.onerror = () => {
      addLine('error', '✕ WebSocket connection failed')
      setStatus('error')
    }

    ws.onclose = () => {
      if (status !== 'done' && status !== 'error') {
        // Only show disconnect if we didn't get a clean done/error
        setStatus(prev => (prev === 'running' || prev === 'waiting_input') ? 'error' : prev)
      }
    }
  }, [code, addLine, status])

  // ── Stop handler — close WebSocket mid-execution ───────────────────────────
  const handleStop = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) {
      wsRef.current.close()
    }
    addLine('info', '⏹ Execution stopped')
    setStatus('idle')
  }, [addLine])

  // ── Input submit handler — user presses Enter ──────────────────────────────
  const handleInputSubmit = useCallback((e) => {
    e.preventDefault()
    if (!wsRef.current || wsRef.current.readyState !== 1) return

    const value = inputText
    wsRef.current.send(JSON.stringify({ type: 'input_response', value }))

    // Echo the typed value into the console (like a real terminal)
    addLine('input', value)
    setInputText('')
    setStatus('running')
  }, [inputText, addLine])

  // ── Clear console ──────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setLines([])
    lineIdRef.current = 0
  }, [])

  const isConnected = status === 'running' || status === 'waiting_input'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Header / Controls ──────────────────────────────────────────────── */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]">Interactive Console</span>
          {/* Status indicator dot */}
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
            status === 'running'       ? 'bg-green-400 animate-pulse' :
            status === 'waiting_input' ? 'bg-yellow-400 animate-pulse' :
            status === 'error'         ? 'bg-red-400' :
            status === 'done'          ? 'bg-blue-400' :
                                         'bg-gray-600'
          }`} />
          <span className="text-[10px] text-gray-500 font-mono">
            {status === 'idle'          && 'Ready'}
            {status === 'connecting'    && 'Connecting…'}
            {status === 'running'       && 'Running'}
            {status === 'waiting_input' && 'Waiting for input…'}
            {status === 'done'          && 'Done'}
            {status === 'error'         && 'Error'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Clear button */}
          <button
            onClick={handleClear}
            disabled={isConnected}
            title="Clear console"
            className="px-2 py-0.5 text-[10px] font-mono text-gray-500 hover:text-white
                       border border-[#374151] rounded transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>

          {/* Run / Stop toggle */}
          {isConnected ? (
            <button
              onClick={handleStop}
              className="px-2.5 py-0.5 text-[10px] font-mono font-medium text-red-400
                         border border-red-800 rounded hover:bg-red-900/30
                         transition-colors"
            >
              ⏹ Stop
            </button>
          ) : (
            <button
              onClick={handleRun}
              disabled={status === 'connecting'}
              className="px-2.5 py-0.5 text-[10px] font-mono font-medium text-white
                         bg-green-600 border border-green-500 rounded hover:bg-green-500
                         transition-colors disabled:opacity-50"
            >
              ▶ Run
            </button>
          )}
        </div>
      </div>

      {/* ── Terminal output area ───────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-[#0B1120] px-4 py-3 font-mono text-sm
                   scrollbar-thin scrollbar-thumb-gray-700"
      >
        {lines.length === 0 && status === 'idle' && (
          <div className="text-gray-600 text-xs leading-relaxed">
            <p>Click <span className="text-green-400">▶ Run</span> to execute your code interactively.</p>
            <p className="mt-1">
              Every <code className="text-yellow-400/80">print()</code> output appears here in real time.
            </p>
            <p className="mt-1">
              When your code calls <code className="text-yellow-400/80">input()</code>,
              you'll be prompted to type your response right here — just like a real terminal.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
              className={`whitespace-pre-wrap break-all leading-relaxed ${lineClass(line.type)}`}
            >
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Inline input field (shown when waiting for input) ────────── */}
        {status === 'waiting_input' && (
          <motion.form
            onSubmit={handleInputSubmit}
            className="flex items-center gap-0 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-cyan-400 shrink-0">{'>'} </span>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 bg-transparent text-cyan-300 outline-none caret-cyan-400
                         font-mono text-sm placeholder-gray-600"
              placeholder="Type your input and press Enter…"
              autoFocus
            />
          </motion.form>
        )}
      </div>
    </div>
  )
}
