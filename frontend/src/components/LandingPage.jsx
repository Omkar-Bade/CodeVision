import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

/* ─── Subtle dot-grid background ────────────────────────────────
   A very faint radial-gradient dot pattern — feels like a
   developer tool (similar to Figma / Excalidraw) without being
   "futuristic".  Rendered as a single CSS div, no canvas needed.
*/
function DotGrid() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
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
  const [done, setDone] = useState([])
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    if (lineIdx >= TERMINAL_LINES.length) return
    const line = TERMINAL_LINES[lineIdx]
    if (charIdx < line.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 30)
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
    <div className="bg-[#0d1117] border border-[#1F2937] rounded-xl p-5 font-mono text-sm w-full max-w-lg">
      {/* Window chrome */}
      <div className="flex items-center gap-2 mb-4">
        <span className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" />
        <span className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
        <span className="ml-3 text-gray-500 text-xs">codevision — terminal</span>
      </div>

      {done.map((l, i) => (
        <div key={i} className="text-green-400 mb-1 text-xs">{l}</div>
      ))}

      {lineIdx < TERMINAL_LINES.length && (
        <div className="text-green-400 text-xs">
          {TERMINAL_LINES[lineIdx].slice(0, charIdx)}
          <span className="animate-pulse text-blue-400 ml-0.5">█</span>
        </div>
      )}
    </div>
  )
}

/* ─── Typed subtext ──────────────────────────────────────────── */
const HERO_SUBTEXT = 'See how programs work internally — variable by variable, line by line.'

function TypedSubtext() {
  const [visible, setVisible] = useState('')

  useEffect(() => {
    let idx = 0
    const id = setInterval(() => {
      idx += 1
      setVisible(HERO_SUBTEXT.slice(0, idx))
      if (idx >= HERO_SUBTEXT.length) clearInterval(id)
    }, 26)
    return () => clearInterval(id)
  }, [])

  return (
    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
      {visible}
      {visible.length < HERO_SUBTEXT.length && (
        <span className="animate-pulse text-blue-400 ml-0.5">|</span>
      )}
    </p>
  )
}

/* ─── Feature Card ───────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <motion.div
      className="bg-[#111827] border border-[#1F2937] rounded-xl p-6
                 hover:border-[#374151] hover:-translate-y-1
                 transition-all duration-200 cursor-default"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </motion.div>
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
      desc: 'See every variable appear, update, and change with animated memory cards showing type and allocated bytes.',
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
    <div className="min-h-screen bg-[#0B1120] text-[#E5E7EB] overflow-x-hidden">
      <DotGrid />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                       bg-blue-600/10 border border-blue-600/30 text-blue-400
                       text-xs font-mono mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Python Code Visualizer
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-white">Visualize Code.</span>
            <br />
            <span className="text-blue-400">Understand Logic.</span>
          </motion.h1>

          {/* Typed subtext */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <TypedSubtext />
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <button
              onClick={() => navigate('/visualizer')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg
                         bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm
                         transition-colors duration-150"
            >
              <span>▶</span> Start Visualizing
            </button>
            <button
              onClick={() => navigate('/guide')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg
                         bg-blue-600/10 border border-blue-600/40 text-blue-400
                         hover:bg-blue-600/20 hover:border-blue-500/60 hover:text-blue-300
                         font-semibold text-sm transition-colors duration-150"
            >
              📖 View Guide
            </button>
            <button
              onClick={() => navigate('/notes')}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg
                         border border-[#374151] text-gray-300 hover:bg-[#1F2937] hover:text-white
                         font-semibold text-sm transition-colors duration-150"
            >
              Explore Concepts
            </button>
          </motion.div>

          {/* Terminal typer */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <TerminalTyper />
          </motion.div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4 border-y border-[#1F2937] bg-[#111827]/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
              Everything You Need to{' '}
              <span className="text-blue-400">Learn Programming</span>
            </h2>
            <p className="text-gray-400 text-sm">
              CodeVision makes abstract concepts concrete, visual, and interactive.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Guide Banner ──────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="bg-[#111827] border border-blue-600/25 rounded-2xl p-8 md:p-10
                       flex flex-col md:flex-row items-center gap-6 md:gap-10"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Icon */}
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-600/30
                            flex items-center justify-center text-3xl">
              📖
            </div>

            {/* Text */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full
                             bg-blue-600/10 border border-blue-600/30 text-blue-400
                             text-[11px] font-mono mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                New to CodeVision?
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Read the User Guide first
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                Not sure where to start? Our step-by-step guide covers everything — from
                writing your first program to understanding memory visualization,
                execution controls, and beginner tips.
              </p>
            </div>

            {/* CTA */}
            <div className="shrink-0">
              <button
                onClick={() => navigate('/guide')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                           bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm
                           transition-colors duration-150 whitespace-nowrap"
              >
                View Guidance →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── IDE Preview ──────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
              See It in <span className="text-green-400">Action</span>
            </h2>
            <p className="text-gray-400 text-sm">A preview of the CodeVision workspace</p>
          </motion.div>

          <motion.div
            className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d1117] border-b border-[#1F2937]">
              <span className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
              <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" />
              <span className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
              <span className="ml-4 text-gray-500 text-xs font-mono">CodeVision Visualizer</span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#1F2937] min-h-48">
              {/* Editor */}
              <div className="p-5">
                <div className="text-gray-500 text-[10px] mb-3 font-mono tracking-widest uppercase">Editor</div>
                <div className="font-mono text-sm space-y-1">
                  {[
                    { n: 1, c: <><span className="text-yellow-300">a</span><span className="text-gray-300"> = </span><span className="text-blue-300">5</span></> },
                    { n: 2, c: <><span className="text-yellow-300">b</span><span className="text-gray-300"> = </span><span className="text-yellow-300">a</span></>, active: true },
                    { n: 3, c: <><span className="text-yellow-300">a</span><span className="text-gray-300"> = </span><span className="text-blue-300">10</span></> },
                    { n: 4, c: <><span className="text-blue-300">print</span><span className="text-gray-300">(a, b)</span></> },
                  ].map(({ n, c, active }) => (
                    <div key={n} className={`flex gap-3 px-1 py-0.5 rounded ${active ? 'line-active' : ''}`}>
                      <span className="text-gray-600 select-none w-4 text-right">{n}</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution */}
              <div className="p-5">
                <div className="text-gray-500 text-[10px] mb-3 font-mono tracking-widest uppercase">Execution</div>
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3 font-mono text-sm">
                  <div className="text-gray-400 text-xs mb-2">▶ Step 2 of 4</div>
                  <div className="text-white">
                    <span className="text-yellow-300">b</span>
                    <span className="text-gray-300"> = </span>
                    <span className="text-yellow-300">a</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Copying value of <span className="text-yellow-300">a</span> into <span className="text-yellow-300">b</span>
                  </div>
                </div>
              </div>

              {/* Memory */}
              <div className="p-5">
                <div className="text-gray-500 text-[10px] mb-3 font-mono tracking-widest uppercase">Memory</div>
                <div className="space-y-2">
                  <div className="bg-[#0B1120] border border-green-600/40 rounded-lg p-2.5 flex justify-between items-center">
                    <span className="text-yellow-300 font-mono text-sm font-semibold">a</span>
                    <span className="text-blue-300 font-mono font-bold">5</span>
                  </div>
                  <div className="bg-[#0B1120] border border-blue-600/40 rounded-lg p-2.5 flex justify-between items-center">
                    <span className="text-yellow-300 font-mono text-sm font-semibold">b</span>
                    <span className="text-blue-400 font-mono font-bold">5</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4 text-center border-t border-[#1F2937]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to{' '}
            <span className="text-blue-400">understand code</span>?
          </h2>
          <p className="text-gray-400 mb-8 text-base">
            Join the visual revolution in programming education.
          </p>
          <button
            onClick={() => navigate('/visualizer')}
            className="px-10 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg
                       font-semibold text-base transition-colors duration-150"
          >
            Launch Visualizer →
          </button>
        </motion.div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
