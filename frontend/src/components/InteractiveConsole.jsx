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

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
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

const InteractiveConsole = forwardRef(function InteractiveConsole(
  { code, isActive, onStep, onInputRequest, onReset, onStatusChange },
  ref
) {
  // ── State ──────────────────────────────────────────────────────────────────
  // lines          — array of { id, type, text, prompt, value } for the console display
  // status         — 'idle' | 'connecting' | 'running' | 'waiting_input' | 'done' | 'error'
  // inputText      — current value of the inline input field
  // currentPrompt  — active prompt string from input(prompt)
  // history        — list of previously submitted inputs
  // historyIdx     — current index when navigating history with Up/Down keys
  const [lines, setLines] = useState([])
  const [status, setStatus] = useState('idle')
  const [inputText, setInputText] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [history, setHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [copied, setCopied] = useState(false)

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
  }, [lines, status, inputText])

  // ── Focus the input field when waiting for input ───────────────────────────
  useEffect(() => {
    if (status === 'waiting_input' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [status])

  // ── Cleanup WebSocket on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState <= 1) {
        wsRef.current.close()
      }
    }
  }, [])

  // ── Helper: add a line to the console ──────────────────────────────────────
  const addLine = useCallback((lineObj) => {
    lineIdRef.current += 1
    setLines(prev => [...prev, { id: lineIdRef.current, ...lineObj }])
  }, [])

  // ── Run handler — connect WS and send code ─────────────────────────────────
  const handleRun = useCallback(() => {
    if (!code.trim()) return

    // Reset console & parent visualizer steps if callback provided
    setLines([])
    setStatus('connecting')
    setInputText('')
    setCurrentPrompt('')
    lineIdRef.current = 0
    if (onReset) onReset()

    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('running')
      addLine({ type: 'info', text: '▶ Interactive execution started…' })
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
          if (msg.text) {
            const parts = msg.text.split('\n')
            parts.forEach((part, i) => {
              // Add part if not the trailing empty string from a ending newline
              if (i < parts.length - 1 || part) {
                addLine({ type: 'output', text: part })
              }
            })
          }
          break

        case 'step':
          if (msg.step && onStep) {
            onStep(msg.step)
          }
          break

        case 'input_request':
          setCurrentPrompt(msg.prompt || '')
          setStatus('waiting_input')
          if (msg.step && onStep) {
            onStep(msg.step)
          }
          if (onInputRequest) {
            onInputRequest(msg.prompt, msg.step)
          }
          break

        case 'done':
          addLine({ type: 'info', text: '✔ Program finished successfully.' })
          setStatus('done')
          ws.close()
          break

        case 'error':
          addLine({ type: 'error', text: `✕ ${msg.message}` })
          setStatus('error')
          ws.close()
          break

        default:
          break
      }
    }

    ws.onerror = () => {
      addLine({ type: 'error', text: '✕ WebSocket connection failed' })
      setStatus('error')
    }

    ws.onclose = () => {
      if (status !== 'done' && status !== 'error') {
        setStatus(prev => (prev === 'running' || prev === 'waiting_input') ? 'error' : prev)
      }
    }
  }, [code, addLine, status, onStep, onInputRequest, onReset])

  // ── Stop handler — close WebSocket mid-execution ───────────────────────────
  const handleStop = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) {
      wsRef.current.close()
    }
    addLine({ type: 'info', text: '⏹ Execution stopped' })
    setStatus('idle')
  }, [addLine])

  // ── Input submit handler — user presses Enter ──────────────────────────────
  const handleInputSubmit = useCallback((e) => {
    e?.preventDefault()
    if (!wsRef.current || wsRef.current.readyState !== 1) return

    const value = inputText
    wsRef.current.send(JSON.stringify({ type: 'input_response', value }))

    // Add to input history
    setHistory(prev => [...prev, value])
    setHistoryIdx(-1)

    // Commit prompt + typed input as an authentic inline prompt entry
    addLine({ type: 'prompt_input', prompt: currentPrompt, value })
    setInputText('')
    setCurrentPrompt('')
    setStatus('running')
  }, [inputText, currentPrompt, addLine])

  // ── Keyboard Navigation (Up/Down for history, Ctrl+L clear, Ctrl+C stop) ───
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setLines([])
      lineIdRef.current = 0
      return
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault()
      if (status === 'running' || status === 'waiting_input') {
        handleStop()
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length === 0) return
      setHistoryIdx(prev => {
        const nextIdx = prev < history.length - 1 ? prev + 1 : prev
        setInputText(history[history.length - 1 - nextIdx] ?? '')
        return nextIdx
      })
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx <= 0) {
        setHistoryIdx(-1)
        setInputText('')
        return
      }
      setHistoryIdx(prev => {
        const nextIdx = prev - 1
        setInputText(history[history.length - 1 - nextIdx] ?? '')
        return nextIdx
      })
      return
    }
  }, [history, historyIdx, status, handleStop])

  // ── Clear console ──────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    setLines([])
    lineIdRef.current = 0
  }, [])

  // ── Copy output to clipboard ───────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const textContent = lines.map(l => {
      if (l.type === 'prompt_input') {
        return `>>> ${l.prompt || ''}${l.value}`
      }
      return l.text ?? ''
    }).join('\n')

    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [lines])

  // Emit status change to parent page for top toolbar synchronization
  useEffect(() => {
    if (onStatusChange) onStatusChange(status)
  }, [status, onStatusChange])

  // Expose imperative API for parent top toolbar
  useImperativeHandle(ref, () => ({
    run: handleRun,
    stop: handleStop,
    restart: () => {
      if (wsRef.current && wsRef.current.readyState <= 1) {
        wsRef.current.close()
      }
      setLines([])
      setStatus('idle')
      lineIdRef.current = 0
      if (onReset) onReset()
      setTimeout(() => {
        handleRun()
      }, 80)
    },
    clear: handleClear,
  }), [handleRun, handleStop, handleClear, onReset])

  const isConnected = status === 'running' || status === 'waiting_input'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0E131F] rounded-t-xl border border-[#1E2638] overflow-hidden">

      {/* ── Header / Controls ──────────────────────────────────────────────── */}
      <div className="panel-header flex items-center justify-between px-4 py-2 bg-[#131926] border-b border-[#1E2638]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-gray-300">🖥️ Interactive Console</span>
          {/* Status indicator dot */}
          <span className={`inline-block w-2 h-2 rounded-full ${
            status === 'running'       ? 'bg-green-400 animate-pulse' :
            status === 'waiting_input' ? 'bg-yellow-400 animate-pulse' :
            status === 'error'         ? 'bg-red-400' :
            status === 'done'          ? 'bg-blue-400' :
                                         'bg-gray-600'
          }`} />
          <span className="text-[10px] text-gray-400 font-mono">
            {status === 'idle'          && 'Ready'}
            {status === 'connecting'    && 'Connecting…'}
            {status === 'running'       && 'Executing…'}
            {status === 'waiting_input' && 'Waiting for input…'}
            {status === 'done'          && 'Finished'}
            {status === 'error'         && 'Error'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy output button */}
          <button
            onClick={handleCopy}
            disabled={lines.length === 0}
            title="Copy console output"
            className="px-2 py-0.5 text-[10px] font-mono text-gray-400 hover:text-white
                       border border-[#2A3446] rounded transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>

          {/* Clear button */}
          <button
            onClick={handleClear}
            disabled={isConnected}
            title="Clear console (Ctrl+L)"
            className="px-2 py-0.5 text-[10px] font-mono text-gray-400 hover:text-white
                       border border-[#2A3446] rounded transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Terminal output area ───────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-[#0B0B0D] px-4 py-3 font-mono text-xs
                   scrollbar-thin scrollbar-thumb-gray-700 select-text"
      >
        {lines.length === 0 && status === 'idle' && (
          <div className="text-gray-500 text-xs leading-relaxed">
            <p>Click <span className="text-blue-400 font-semibold">▶ Run</span> in the top toolbar to start interactive execution.</p>
            <p className="mt-1">
              Every <code className="text-yellow-400/90">print()</code> output and <code className="text-yellow-400/90">input()</code> prompt streams here in real time.
            </p>
            <p className="mt-1 text-gray-600">
              Shortcuts: <kbd className="px-1 py-0.5 bg-[#1F2937] rounded text-gray-400">Ctrl+L</kbd> Clear &middot; <kbd className="px-1 py-0.5 bg-[#1F2937] rounded text-gray-400">Ctrl+C</kbd> Interrupt &middot; <kbd className="px-1 py-0.5 bg-[#1F2937] rounded text-gray-400">↑/↓</kbd> History
            </p>
          </div>
        )}

        <div className="flex flex-col gap-0 font-mono text-xs leading-tight">
          {lines.map((line) => {
            if (line.type === 'info') {
              return (
                <div key={line.id} className="text-blue-400 font-semibold py-0.5">
                  {line.text}
                </div>
              )
            }
            if (line.type === 'error') {
              return (
                <div key={line.id} className="text-red-400 whitespace-pre-wrap py-0.5">
                  {line.text}
                </div>
              )
            }
            if (line.type === 'prompt_input') {
              return (
                <div key={line.id} className="flex items-center gap-0 whitespace-pre">
                  <span className="text-yellow-400 font-bold shrink-0">{'>>> '}</span>
                  {line.prompt && <span className="text-yellow-200/90 shrink-0">{line.prompt}</span>}
                  <span className="text-cyan-300 font-semibold">{line.value}</span>
                </div>
              )
            }
            // Standard stdout output
            return (
              <div key={line.id} className="text-gray-200 whitespace-pre-wrap">
                {line.text}
              </div>
            )
          })}

          {/* ── Active inline input field (shown when waiting for input) ────────── */}
          {status === 'waiting_input' && (
            <form onSubmit={handleInputSubmit} className="flex items-center gap-0 whitespace-pre">
              <span className="text-yellow-400 font-bold shrink-0">{'>>> '}</span>
              {currentPrompt && (
                <span className="text-yellow-200/90 shrink-0">{currentPrompt}</span>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-cyan-300 font-semibold outline-none caret-cyan-400
                           font-mono text-xs p-0 m-0 border-none focus:ring-0"
                autoFocus
              />
            </form>
          )}
        </div>
      </div>
    </div>
  )
})

export default InteractiveConsole
