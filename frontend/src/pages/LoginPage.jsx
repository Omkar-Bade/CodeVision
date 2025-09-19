import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }

    setLoading(true)
    try {
      await signIn({ email: form.email, password: form.password })
      navigate('/')
    } catch (err) {
      setError(err.message ?? 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-2xl font-bold text-white mb-1">Sign in</h1>
        <p className="text-gray-400 text-sm mb-6">Welcome back to CodeVision</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
            <input
              type="email" name="email" autoComplete="email"
              value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5 text-sm
                         text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-gray-400">Password</label>
            </div>
            <input
              type="password" name="password" autoComplete="current-password"
              value={form.password} onChange={handleChange}
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:underline">Create one</Link>
        </p>
      </motion.div>

      <p className="mt-6 text-xs text-gray-600">© 2025 CodeVision</p>
    </div>
  )
}
