import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return }
    if (form.password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      await signUp({ name: form.name, email: form.email, password: form.password })
      // Supabase may require email confirmation — show success state
      setSuccess(true)
    } catch (err) {
      setError(err.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center px-4">
        <motion.div
          className="w-full max-w-sm bg-[#111827] border border-[#1F2937] rounded-xl p-8 text-center"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-white mb-2">Account created!</h2>
          <p className="text-gray-400 text-sm mb-6">
            Check your email inbox and click the confirmation link, then sign in.
          </p>
          <Link to="/login"
            className="block w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm text-center transition-colors">
            Go to Sign In
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
          <span className="text-white font-bold text-sm font-mono">CV</span>
        </div>
        <span className="font-bold text-xl font-mono text-white">
          Code<span className="text-blue-400">Vision</span>
        </span>
      </Link>

      <motion.div
        className="w-full max-w-sm bg-[#111827] border border-[#1F2937] rounded-xl p-8"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-gray-400 text-sm mb-6">Join CodeVision for free</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
            <input
              type="text" name="name"
              value={form.name} onChange={handleChange}
              placeholder="Alice Johnson"
              className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5 text-sm
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
            <input
              type="email" name="email"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5 text-sm
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input
              type="password" name="password"
              value={form.password} onChange={handleChange}
              placeholder="Min. 6 characters"
              className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5 text-sm
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Confirm password</label>
            <input
              type="password" name="confirm"
              value={form.confirm} onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5 text-sm
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60
                       disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm
                       transition-colors duration-150 mt-2"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </motion.div>

      <p className="mt-6 text-xs text-gray-600">© 2025 CodeVision</p>
    </div>
  )
}
