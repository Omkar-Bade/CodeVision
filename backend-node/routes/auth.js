const express = require('express')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')
const protect = require('../middleware/auth')

const router = express.Router()

// Helper — sign a JWT for a given user ID (7-day expiry)
function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// ── POST /api/auth/register ───────────────────────────────────
// Body: { name, email, password }
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide name, email and password' })
    }

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ error: 'An account with that email already exists' })
    }

    const user  = await User.create({ name, email, password })
    const token = signToken(user._id)

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── POST /api/auth/login ──────────────────────────────────────
// Body: { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' })
    }

    // select('+password') overrides the `select: false` in the schema
    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user._id)

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/auth/me ─────────────────────────────────────────
// Returns the currently authenticated user (requires valid JWT)
router.get('/me', protect, (req, res) => {
  const { _id, name, email, createdAt } = req.user
  res.json({ id: _id, name, email, createdAt })
})

module.exports = router
