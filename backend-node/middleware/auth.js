const jwt  = require('jsonwebtoken')
const User = require('../models/User')

/**
 * Protect middleware — verifies the JWT sent in the Authorization header.
 * Attaches the authenticated user object to req.user.
 * Usage: router.get('/me', protect, handler)
 */
async function protect(req, res, next) {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorised — no token' })
  }

  const token = header.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Attach user (without password) to every protected request
    req.user = await User.findById(decoded.id).select('-password')
    if (!req.user) {
      return res.status(401).json({ error: 'User belonging to this token no longer exists' })
    }
    next()
  } catch {
    res.status(401).json({ error: 'Not authorised — invalid token' })
  }
}

module.exports = protect
