/**
 * GuidePage.jsx
 *
 * CodeVision User Guide — explains the platform to new/beginner users.
 * Design follows the existing CodeVision design system:
 *   - Background: #0B1120, Cards: #111827, Border: #1F2937
 *   - Accent: blue-400 / blue-600
 *   - Font: Inter (body), JetBrains Mono (code)
 *   - Animations via framer-motion (same as other pages)
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ─── Dot-grid background (same as LandingPage) ─────────────── */
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

/* ─── Section heading helper ─────────────────────────────────── */
function SectionHeading({ badge, title, accent, subtitle }) {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/30 text-blue-400 text-xs font-mono mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        {badge}
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
        {title}{' '}
        {accent && <span className="text-blue-400">{accent}</span>}
      </h2>
      {subtitle && (
        <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

/* ─── Step Card (Section 2) ──────────────────────────────────── */
function StepCard({ number, title, description, icon, delay }) {
  return (
    <motion.div
      className="flex gap-4 p-5 bg-[#111827] border border-[#1F2937] rounded-xl
                 hover:border-[#374151] hover:-translate-y-0.5 transition-all duration-200"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
    >
      {/* Step number circle */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600/15 border border-blue-600/30
                      flex items-center justify-center text-blue-400 font-bold font-mono text-sm">
        {number}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{icon}</span>
          <h3 className="text-white font-semibold text-base">{title}</h3>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

/* ─── Feature Card (Section 3) ───────────────────────────────── */
function FeatureCard({ icon, title, description, color, delay }) {
  const colorMap = {
    blue:   { ring: 'border-blue-600/30',   badge: 'bg-blue-600/10 text-blue-400'   },
    green:  { ring: 'border-green-600/30',  badge: 'bg-green-600/10 text-green-400' },
    purple: { ring: 'border-purple-600/30', badge: 'bg-purple-600/10 text-purple-400' },
    amber:  { ring: 'border-amber-600/30',  badge: 'bg-amber-600/10 text-amber-400' },
    red:    { ring: 'border-red-600/30',    badge: 'bg-red-600/10 text-red-400'     },
    cyan:   { ring: 'border-cyan-600/30',   badge: 'bg-cyan-600/10 text-cyan-400'   },
    violet: { ring: 'border-violet-600/30', badge: 'bg-violet-600/10 text-violet-400' },
  }
  const c = colorMap[color] ?? colorMap.blue

  return (
    <motion.div
      className={`p-5 bg-[#111827] border ${c.ring} rounded-xl
                  hover:border-opacity-60 hover:-translate-y-1 transition-all duration-200 cursor-default`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
    >
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${c.badge} text-xl mb-3`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold text-sm mb-1.5">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

/* ─── Benefit Item (Section 4) ───────────────────────────────── */
function BenefitItem({ text, delay }) {
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
    >
      <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-600/15 border border-green-600/30
                       flex items-center justify-center text-green-400 text-xs">✓</span>
      <p className="text-gray-300 text-sm leading-relaxed">{text}</p>
    </motion.div>
  )
}

/* ─── Tip Card (Section 5) ───────────────────────────────────── */
function TipCard({ icon, tip, delay }) {
  return (
    <motion.div
      className="flex items-start gap-3 px-4 py-3.5 bg-[#111827] border border-[#1F2937] rounded-xl
                 hover:border-amber-700/40 transition-all duration-200"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.3 }}
    >
      <span className="text-xl shrink-0 mt-0.5">{icon}</span>
      <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
    </motion.div>
  )
}

/* ─── User Type Card (Section 6) ─────────────────────────────── */
function UserCard({ icon, label, desc, delay }) {
  return (
    <motion.div
      className="text-center p-6 bg-[#111827] border border-[#1F2937] rounded-xl
                 hover:border-blue-700/40 hover:-translate-y-1 transition-all duration-200 cursor-default"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-white font-semibold text-sm mb-1">{label}</h3>
      <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
    </motion.div>
  )
}

/* ─── Collapsible FAQ ────────────────────────────────────────── */
function FAQ({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#1F2937] rounded-xl overflow-hidden bg-[#111827]
                    hover:border-[#374151] transition-colors duration-200">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-gray-200 text-sm font-medium">{question}</span>
        <span className={`text-gray-500 text-xs font-mono ml-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-[#1F2937] pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Mini IDE Preview ───────────────────────────────────────── */
function MiniIDE() {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden shadow-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d1117] border-b border-[#1F2937]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
        <span className="ml-4 text-gray-500 text-xs font-mono">CodeVision — main.py</span>
        <span className="ml-auto text-[10px] font-mono text-blue-400 bg-blue-600/10 border border-blue-600/20 px-2 py-0.5 rounded-full">
          Step 2 of 4
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#1F2937]">
        {/* Editor */}
        <div className="p-5">
          <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-3">Editor</div>
          <div className="font-mono text-sm space-y-1">
            {[
              { n: 1, active: false, done: true,  content: <><span className="text-yellow-300">a</span><span className="text-gray-300"> = </span><span className="text-blue-300">5</span></> },
              { n: 2, active: true,  done: false, content: <><span className="text-yellow-300">b</span><span className="text-gray-300"> = </span><span className="text-yellow-300">a</span></> },
              { n: 3, active: false, done: false, content: <><span className="text-yellow-300">a</span><span className="text-gray-300"> = </span><span className="text-blue-300">10</span></> },
              { n: 4, active: false, done: false, content: <><span className="text-blue-300">print</span><span className="text-gray-300">(a, b)</span></> },
            ].map(({ n, active, done, content }) => (
              <div key={n} className={`flex gap-3 px-1 py-0.5 rounded ${active ? 'line-active' : done ? 'line-done' : ''}`}>
                <span className="text-gray-600 select-none w-4 text-right shrink-0">{n}</span>
                <span>{content}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Execution */}
        <div className="p-5">
          <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-3">Execution</div>
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3 font-mono text-sm mb-3">
            <div className="text-gray-400 text-xs mb-1.5">▶ Executing line 2</div>
            <div className="text-white">
              <span className="text-yellow-300">b</span>
              <span className="text-gray-300"> = </span>
              <span className="text-yellow-300">a</span>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Copying value of <span className="text-yellow-300">a</span> into <span className="text-yellow-300">b</span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['◀ Back', '▶ Step', '⏩ Run'].map(label => (
              <button key={label} className="px-2.5 py-1 text-[11px] font-mono border border-[#374151] text-gray-400 rounded-lg hover:bg-[#1F2937] hover:text-white transition-colors duration-150">
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Memory */}
        <div className="p-5">
          <div className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-3">Memory</div>
          <div className="space-y-2">
            <div className="bg-[#0B1120] border border-green-600/40 rounded-lg p-2.5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-yellow-300 font-mono text-sm font-semibold">a</span>
                <span className="text-[10px] font-mono text-gray-500">int · 28B</span>
              </div>
              <span className="text-blue-300 font-mono font-bold text-lg">5</span>
            </div>
            <div className="bg-[#0B1120] border border-blue-600/40 rounded-lg p-2.5 relative">
              <div className="flex justify-between items-center mb-1">
                <span className="text-yellow-300 font-mono text-sm font-semibold">b</span>
                <span className="text-[10px] font-mono text-blue-400 font-mono">NEW</span>
              </div>
              <span className="text-blue-400 font-mono font-bold text-lg">5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   Main Page
   ─────────────────────────────────────────────────────────────── */
export default function GuidePage() {
  const navigate = useNavigate()

  const steps = [
    { number: '01', icon: '✍️', title: 'Write Python Code', description: 'Open the Visualizer and type any Python code into the Monaco editor on the left. It supports the same editing experience as VS Code.' },
    { number: '02', icon: '▶️', title: 'Click Run', description: 'Press the Run button to execute your code. CodeVision will load all execution steps into memory instantly.' },
    { number: '03', icon: '👣', title: 'Step Through Execution', description: 'Use the Step button to move through your program one line at a time. Each step highlights the line currently being executed.' },
    { number: '04', icon: '🧠', title: 'Watch Memory Change', description: 'Observe the Memory Panel on the right. Variables appear as they are created and their values update in real time with each step.' },
    { number: '05', icon: '🖥️', title: 'Check Console Output', description: 'The Console Panel shows any print() output or error messages. Errors are highlighted and explained in beginner-friendly language.' },
    { number: '06', icon: '🔄', title: 'Restart & Experiment', description: 'Use the Restart button to reset to the beginning and try different code. Modify the program and observe how the execution changes.' },
  ]

  const features = [
    { icon: '📝', title: 'Monaco Code Editor', description: 'The same editor used in VS Code — with Python syntax highlighting, auto-indentation, and a comfortable coding experience.', color: 'blue' },
    { icon: '👣', title: 'Step-by-Step Execution', description: 'Move through your program one line at a time and see exactly how each statement changes the state of the program.', color: 'green' },
    { icon: '🧠', title: 'Live Memory Visualization', description: 'Variables are displayed as animated memory blocks showing their name, type, and current value at every step.', color: 'purple' },
    { icon: '🖥️', title: 'Console Output Panel', description: 'All program output from print() statements shows up in a dedicated console area, separated from the execution view.', color: 'cyan' },
    { icon: '🚨', title: 'Syntax Error Detection', description: 'Errors are highlighted directly inside the editor and explained with beginner-friendly descriptions to help you learn from mistakes.', color: 'red' },
    { icon: '🔧', title: 'Function Visualization', description: 'Function calls are tracked and local variables inside functions are shown in their own scope during execution.', color: 'amber' },
    { icon: '⏯️', title: 'Execution Controls', description: 'Full playback control: Run, Pause, Step Forward, Step Backward, and Restart — giving you total control over execution speed.', color: 'violet' },
    { icon: '📚', title: 'Built-in Courses & Notes', description: 'Access curated Python courses, concept notes, and interactive tutorials designed specifically for beginners.', color: 'green' },
  ]

  const benefits = [
    'Understand how variables are created and stored in memory',
    'See exactly how values change during each step of execution',
    'Follow function calls and understand local vs global scope',
    'Watch program flow move line by line through conditionals and loops',
    'Learn why errors happen and how to fix them with clear explanations',
    'Build confidence by experimenting with small programs safely',
  ]

  const tips = [
    { icon: '🐢', tip: 'Use Step execution to go slowly and understand exactly what happens at each line before moving on.' },
    { icon: '👁️', tip: 'Keep an eye on the Memory Panel — watch how variables appear, change, and sometimes disappear.' },
    { icon: '🔬', tip: 'Try modifying the code — change a value or add a line and click Run again to see what changes.' },
    { icon: '📐', tip: 'Start with small, simple programs. A 5-line program is easier to trace step-by-step than a 50-line one.' },
    { icon: '📚', tip: 'Use the Tutorials page to see pre-built examples with step-by-step explanations of what each line does.' },
    { icon: '🔁', tip: "Don't be afraid to Restart — pressing Restart never deletes your code, it just resets the execution state." },
  ]

  const users = [
    { icon: '🎓', label: 'Beginners Learning Python', desc: 'Perfect for anyone just starting to code who wants to understand what their program is actually doing.' },
    { icon: '🏫', label: 'Computer Science Students', desc: 'Ideal for students studying CS who need to understand memory, variable scope, or execution flow for their coursework.' },
    { icon: '👨‍🏫', label: 'Programming Instructors', desc: 'Teachers can use CodeVision in classrooms to visually demonstrate concepts and make abstract ideas concrete.' },
    { icon: '🔍', label: 'Curious Developers', desc: 'Anyone who wants to deeply understand how Python interprets and executes code under the hood.' },
  ]

  const faqs = [
    { question: 'Do I need to install anything to use CodeVision?', answer: 'No. CodeVision runs entirely in the browser. Just open the website, log in, and start writing Python code immediately.' },
    { question: 'Which Python features does CodeVision support?', answer: 'CodeVision supports most standard Python 3 features including variables, arithmetic, strings, lists, dictionaries, loops, conditionals, and functions. Complex libraries like NumPy are not supported in visualization mode.' },
    { question: 'How do I fix a syntax error?', answer: 'When a syntax error occurs, the line number and a beginner-friendly error explanation will appear. Look at the highlighted line in the editor, fix the mistake, and click Run again.' },
    { question: 'Can I save my code?', answer: 'Currently, code is not automatically saved between sessions. You can copy your code before leaving. Saving features are planned for future updates.' },
    { question: 'Why is my program not running?', answer: 'Make sure your code has no syntax errors. The error explanation panel will appear if something is wrong. Also ensure you are logged in — the Visualizer requires authentication.' },
    { question: "What is the difference between Step and Run?", answer: "Run executes your entire program automatically and shows all execution steps. Step moves through steps one at a time, giving you full control to pause and observe each change." },
  ]

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E5E7EB] overflow-x-hidden">
      <DotGrid />
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-28 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                       bg-blue-600/10 border border-blue-600/30 text-blue-400
                       text-xs font-mono mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            User Guide · Getting Started
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
          >
            <span className="text-white">CodeVision </span>
            <span className="text-blue-400">User Guide</span>
          </motion.h1>

          <motion.p
            className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            This guide explains how to use CodeVision and how it helps beginners
            understand programming by visualizing code execution{' '}
            <span className="text-blue-400">step by step</span>.
          </motion.p>

          {/* Quick-jump pills */}
          <motion.div
            className="flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            {[
              ['#what-is', '§1 What is CodeVision?'],
              ['#how-to-use', '§2 How to Use'],
              ['#features', '§3 Features'],
              ['#benefits', '§4 Why Use It'],
              ['#tips', '§5 Tips'],
              ['#who', '§6 Who Is It For'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="px-3 py-1.5 text-xs font-mono border border-[#374151]
                           text-gray-400 hover:text-blue-400 hover:border-blue-700/50
                           rounded-lg transition-colors duration-150"
              >
                {label}
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Section 1: What is CodeVision? ──────────────────────── */}
      <section id="what-is" className="relative z-10 py-16 px-4 border-t border-[#1F2937]">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            badge="Section 1"
            title="What is"
            accent="CodeVision?"
            subtitle="A quick introduction to the platform and what makes it different from a regular code editor."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Text explanation */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">CodeVision</span> is an interactive
                programming visualization platform designed to help students understand how Python
                programs execute internally — not just what they output.
              </p>
              <p className="text-gray-400 leading-relaxed text-sm">
                Most editors show you only the final result of running your code. CodeVision goes
                further: it records every step your program takes and lets you replay them at your
                own pace, so you can see the exact moment a variable is created, when a value
                changes, and how execution flows through your code.
              </p>

              <div className="bg-[#0d1117] border border-[#1F2937] rounded-xl p-4">
                <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-3">
                  Instead of just seeing this…
                </p>
                <div className="font-mono text-sm text-green-400 mb-4">
                  &gt; 10 5
                </div>
                <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase mb-3">
                  You see all of this:
                </p>
                <div className="space-y-1.5">
                  {[
                    { icon: '⚡', label: 'Execution steps', color: 'text-blue-400' },
                    { icon: '📦', label: 'Variable creation', color: 'text-yellow-400' },
                    { icon: '💾', label: 'Memory changes',   color: 'text-green-400' },
                    { icon: '📞', label: 'Function calls',   color: 'text-purple-400' },
                    { icon: '🖥️', label: 'Console output',   color: 'text-cyan-400'  },
                    { icon: '🚨', label: 'Syntax errors',    color: 'text-red-400'   },
                  ].map(({ icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-sm">{icon}</span>
                      <span className={`text-sm font-mono ${color}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Mini IDE preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.45 }}
            >
              <MiniIDE />
              <p className="text-gray-600 text-xs text-center mt-3 font-mono">
                ↑ A snapshot of the CodeVision Visualizer in action
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 2: How to Use ─────────────────────────────── */}
      <section id="how-to-use" className="relative z-10 py-16 px-4 border-t border-[#1F2937] bg-[#111827]/40">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            badge="Section 2"
            title="How to Use"
            accent="CodeVision"
            subtitle="Follow these 6 steps to get started with your first visualization."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <StepCard key={step.number} {...step} delay={i * 0.07} />
            ))}
          </div>

          {/* CTA */}
          <motion.div
            className="mt-8 p-6 bg-[#111827] border border-blue-700/30 rounded-xl text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-300 text-sm mb-4">
              Ready to try it yourself? Open the Visualizer and start visualizing right now.
            </p>
            <button
              onClick={() => navigate('/visualizer')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500
                         text-white rounded-lg font-semibold text-sm transition-colors duration-150"
            >
              <span>▶</span> Open Visualizer
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Section 3: Features ───────────────────────────────── */}
      <section id="features" className="relative z-10 py-16 px-4 border-t border-[#1F2937]">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="Section 3"
            title="Features of"
            accent="CodeVision"
            subtitle="Everything the platform provides to make your learning experience powerful and interactive."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Why Use It ─────────────────────────────── */}
      <section id="benefits" className="relative z-10 py-16 px-4 border-t border-[#1F2937] bg-[#111827]/40">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            badge="Section 4"
            title="Why CodeVision Helps"
            accent="Beginners"
            subtitle="Programming is hard when you can't see what the program is actually doing. CodeVision makes the invisible visible."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Beginners often struggle because traditional code editors only show the final output.
                When something goes wrong — or even when it goes right — it's hard to understand
                <em> why</em>. CodeVision bridges that gap by making program execution transparent.
              </p>

              <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider font-mono">
                With CodeVision you will understand:
              </h3>
              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <BenefitItem key={i} text={b} delay={i * 0.06} />
                ))}
              </div>
            </div>

            {/* Quote card */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
            >
              <div className="p-6 bg-[#111827] border border-[#1F2937] rounded-xl">
                <div className="text-4xl mb-3">💡</div>
                <p className="text-gray-300 text-sm leading-relaxed italic mb-3">
                  "The best way to understand a program is not to read it, but to <em>watch it run</em> —
                  step by step, variable by variable."
                </p>
                <p className="text-gray-600 text-xs font-mono">— Core idea behind CodeVision</p>
              </div>

              <div className="p-5 bg-[#0d1117] border border-green-700/30 rounded-xl">
                <div className="text-[10px] font-mono text-green-400 tracking-widest uppercase mb-3">
                  Learning path for beginners
                </div>
                {[
                  { step: '1', label: 'Start with Tutorials', sub: 'Use pre-built examples' },
                  { step: '2', label: 'Read the Notes',       sub: 'Learn key Python concepts' },
                  { step: '3', label: 'Write your own code',  sub: 'Experiment in the Visualizer' },
                  { step: '4', label: 'Take Courses',         sub: 'Build structured knowledge' },
                ].map(({ step, label, sub }) => (
                  <div key={step} className="flex items-start gap-3 mb-3 last:mb-0">
                    <span className="shrink-0 w-5 h-5 rounded-full border border-green-600/50 text-green-400 text-xs flex items-center justify-center font-mono">
                      {step}
                    </span>
                    <div>
                      <p className="text-gray-200 text-sm font-semibold leading-tight">{label}</p>
                      <p className="text-gray-500 text-xs">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Tips ───────────────────────────────────── */}
      <section id="tips" className="relative z-10 py-16 px-4 border-t border-[#1F2937]">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            badge="Section 5"
            title="Tips for Using"
            accent="CodeVision"
            subtitle="Get the most out of the platform with these practical tips for beginners."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tips.map((t, i) => (
              <TipCard key={i} {...t} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Who Should Use It ─────────────────────── */}
      <section id="who" className="relative z-10 py-16 px-4 border-t border-[#1F2937] bg-[#111827]/40">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            badge="Section 6"
            title="Who Should Use"
            accent="CodeVision?"
            subtitle="CodeVision is built for everyone who wants to truly understand how programs work."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map((u, i) => (
              <UserCard key={u.label} {...u} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-4 border-t border-[#1F2937]">
        <div className="max-w-3xl mx-auto">
          <SectionHeading
            badge="FAQ"
            title="Frequently Asked"
            accent="Questions"
            subtitle="Common questions from new CodeVision users."
          />

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <FAQ {...faq} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-4 border-t border-[#1F2937] text-center">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-5xl mb-5">🚀</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to start{' '}
            <span className="text-blue-400">visualizing</span>?
          </h2>
          <p className="text-gray-400 mb-8 text-base leading-relaxed">
            You now know how CodeVision works. Open the Visualizer, write a small Python program,
            and watch it come to life — step by step.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/visualizer')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg
                         bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm
                         transition-colors duration-150"
            >
              <span>▶</span> Launch Visualizer
            </button>
            <button
              onClick={() => navigate('/tutorials')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg
                         border border-[#374151] text-gray-300 hover:bg-[#1F2937] hover:text-white
                         font-semibold text-sm transition-colors duration-150"
            >
              Browse Tutorials →
            </button>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
