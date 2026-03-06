import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function RegisterPage() {
  const navigate              = useNavigate()
  const { registerUser }      = useAuth()
  const [form,   setForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [error,  setError]    = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setLoading(true)
    try {
      await registerUser(form.name, form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#E5E7EB] flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-8">

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl
                              bg-blue-600 mb-4">
                <span className="text-white font-bold text-xl font-mono">CV</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
              <p className="text-gray-400 text-sm">Join CodeVision and start learning</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-800/60 rounded-lg
                              text-red-300 text-sm flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Alice Smith"
                  className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5
                             text-sm text-gray-200 placeholder-gray-600
                             focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5
                             text-sm text-gray-200 placeholder-gray-600
                             focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5
                             text-sm text-gray-200 placeholder-gray-600
                             focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Confirm password</label>
                <input
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0B1120] border border-[#374151] rounded-lg px-4 py-2.5
                             text-sm text-gray-200 placeholder-gray-600
                             focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                           text-white font-semibold rounded-lg text-sm
                           transition-colors duration-150"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
