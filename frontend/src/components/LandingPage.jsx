import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'

/* ─── Binary Rain Canvas ─────────────────────────────────────── */
function BinaryRain() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const SIZE    = 13
    const cols    = () => Math.floor(canvas.width / SIZE)
    let drops     = Array(cols()).fill(1)

    window.addEventListener('resize', () => {
      resize()
      drops = Array(cols()).fill(1)
    })

    const draw = () => {
      ctx.fillStyle = 'rgba(30,30,30,0.06)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font      = `${SIZE}px "Fira Code", monospace`

      drops.forEach((y, x) => {
        const char = Math.random() > 0.5 ? '1' : '0'
        const alpha = 0.08 + Math.random() * 0.12
        ctx.fillStyle = `rgba(0,122,204,${alpha})`
        ctx.fillText(char, x * SIZE, y * SIZE)
        if (y * SIZE > canvas.height && Math.random() > 0.975) drops[x] = 0
        else drops[x]++
      })
    }

    const id = setInterval(draw, 55)
    return () => { clearInterval(id); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.55 }}
    />
  )
}

/* ─── Terminal Typing Animation ──────────────────────────────── */
const TERMINAL_LINES = [
  '> Initializing CodeVision...',
  '> Loading AST Visualization Engine...',
  '> Mounting Memory Tracker...',
  '> System Ready. Start Learning. ✓',
]

function TerminalTyper() {
  const [done, setDone]       = useState([])
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    if (lineIdx >= TERMINAL_LINES.length) return
    const line = TERMINAL_LINES[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 35)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setDone(d => [...d, line])
      setLineIdx(l => l + 1)
      setCharIdx(0)
    }, 400)
    return () => clearTimeout(t)
  }, [lineIdx, charIdx])

  return (
    <div className="bg-black/60 border border-vs-border rounded-xl p-5 font-mono text-sm w-full max-w-lg">
      {/* Traffic lights */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
        <span className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
        <span className="ml-3 text-gray-500 text-xs">codevision — terminal</span>
      </div>

      {done.map((l, i) => (
        <div key={i} className="text-vs-green mb-1 opacity-90">{l}</div>
      ))}

      {lineIdx < TERMINAL_LINES.length && (
        <div className="text-vs-green">
          {TERMINAL_LINES[lineIdx].slice(0, charIdx)}
          <span className="animate-pulse text-vs-blue">█</span>
        </div>
      )}
    </div>
  )
}

/* ─── Feature Card ───────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <motion.div
      className="bg-vs-surface border border-vs-border rounded-xl p-6
                 hover:border-vs-blue hover:-translate-y-1 transition-all duration-300 group"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  )
}

/* ─── Hero typed subtext ────────────────────────────────────── */
const HERO_SUBTEXT =
  'See how programs work internally — variable by variable, line by line.'

function TypedSubtext() {
  const [visible, setVisible] = useState('')

  useEffect(() => {
    let idx = 0
    const interval = setInterval(() => {
      idx += 1
      setVisible(HERO_SUBTEXT.slice(0, idx))
      if (idx >= HERO_SUBTEXT.length) clearInterval(interval)
    }, 28)
    return () => clearInterval(interval)
  }, [])

  return (
    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light">
      <span className="border-l border-cyan-400/60 pl-3 text-slate-300/90">
        {visible}
        {visible.length < HERO_SUBTEXT.length && (
          <span className="animate-pulse text-cyan-400 ml-0.5">▌</span>
        )}
      </span>
    </p>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: '🔍',
      title: 'Line-by-Line Execution',
      desc: 'Watch Python code run one statement at a time. Understand exactly when and how each line changes your program.',
    },
    {
      icon: '🧠',
      title: 'Live Memory Panel',
      desc: 'See every variable appear, update, and change with beautiful animated memory boxes in real time.',
    },
    {
      icon: '⚡',
      title: 'Full Playback Control',
      desc: "Play, pause, step forward, step backward, and control execution speed — you're in the driver's seat.",
    },
    {
      icon: '📚',
      title: 'Built-in Curriculum',
      desc: 'Access curated courses, concept notes, and interactive tutorials designed for absolute beginners.',
    },
  ]

  return (
    <div className="min-h-screen bg-vs-bg text-vs-text overflow-x-hidden">
      <BinaryRain />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-14">
        <div className="max-w-5xl mx-auto text-center">

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 font-sans"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <span className="block">Visualize Code.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-vs-blue via-cyan-400 to-vs-green">
              Understand Logic.
            </span>
          </motion.h1>

          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <TypedSubtext />
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button
              onClick={() => navigate('/visualizer')}
              className="neon-btn neon-btn-primary px-9 py-3.5 text-base"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="text-lg">▶</span>
              <span>Start Visualizing</span>
            </motion.button>
            <motion.button
              onClick={() => navigate('/notes')}
              className="neon-btn neon-btn-muted px-8 py-3.5 text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            >
              Explore Concepts
            </motion.button>
          </motion.div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <TerminalTyper />
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-24 px-4 bg-vs-surface/40 border-y border-vs-border">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Everything You Need to{' '}
              <span className="text-vs-blue">Learn Programming</span>
            </h2>
            <p className="text-gray-400">
              CodeVision makes abstract concepts concrete, visual, and interactive.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Mock IDE Preview ── */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-2">
              See It in <span className="text-vs-green">Action</span>
            </h2>
            <p className="text-gray-400">A live preview of the CodeVision workspace</p>
          </motion.div>

          <motion.div
            className="bg-vs-surface border border-vs-border rounded-2xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#2d2d2d] border-b border-vs-border">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-gray-500 text-xs font-mono">CodeVision Visualizer</span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-vs-border min-h-56">
              {/* Editor col */}
              <div className="p-5">
                <div className="text-gray-500 text-xs mb-3 font-mono tracking-widest">EDITOR</div>
                <div className="font-mono text-sm space-y-1">
                  {[
                    { n: 1, line: <><span className="text-vs-yellow">a</span><span className="text-vs-text"> = </span><span className="text-vs-number">5</span></> },
                    { n: 2, line: <><span className="text-vs-yellow">b</span><span className="text-vs-text"> = </span><span className="text-vs-yellow">a</span></>, active: true },
                    { n: 3, line: <><span className="text-vs-yellow">a</span><span className="text-vs-text"> = </span><span className="text-vs-number">10</span></> },
                    { n: 4, line: <><span className="text-[#569cd6]">print</span><span className="text-vs-text">(a, b)</span></> },
                  ].map(({ n, line, active }) => (
                    <div
                      key={n}
                      className={`flex gap-3 px-1 rounded ${active ? 'line-active' : ''}`}
                    >
                      <span className="text-gray-600 select-none w-4">{n}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution col */}
              <div className="p-5">
                <div className="text-gray-500 text-xs mb-3 font-mono tracking-widest">EXECUTION</div>
                <div className="bg-vs-blue/10 border border-vs-blue/30 rounded-lg p-4 font-mono">
                  <div className="text-gray-500 text-xs mb-2">▶ Step 2 of 4</div>
                  <div className="text-white">
                    <span className="text-vs-yellow">b</span>
                    <span className="text-vs-text"> = </span>
                    <span className="text-vs-yellow">a</span>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    Copying value of <span className="text-vs-yellow">a</span> into <span className="text-vs-yellow">b</span>
                  </div>
                </div>
              </div>

              {/* Memory col */}
              <div className="p-5">
                <div className="text-gray-500 text-xs mb-3 font-mono tracking-widest">MEMORY</div>
                <div className="space-y-3">
                  <div className="bg-vs-bg border border-vs-green/50 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-vs-yellow font-mono font-semibold">a</span>
                    <span className="text-vs-number font-mono font-bold text-lg">5</span>
                  </div>
                  <div className="bg-vs-bg border border-sky-500/50 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-vs-yellow font-mono font-semibold">b</span>
                    <span className="text-vs-blue font-mono font-bold text-lg">5</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-vs-blue to-vs-green">
              understand code
            </span>
            ?
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Join the visual revolution in programming education.
          </p>
          <motion.button
            onClick={() => navigate('/visualizer')}
            className="px-12 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-lg
                       shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-colors duration-200"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Launch Visualizer →
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-vs-border py-8 text-center text-gray-500 text-sm">
        <p className="font-mono">
          CodeVision &nbsp;·&nbsp; Programming Concept Visualizer &nbsp;·&nbsp; Hackathon 2025
        </p>
      </footer>
    </div>
  )
}

