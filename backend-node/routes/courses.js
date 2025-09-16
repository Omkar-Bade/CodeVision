const express = require('express')
const Course  = require('../models/Course')

const router = express.Router()

// ── GET /api/courses ──────────────────────────────────────────
// Returns all courses sorted by the `order` field.
// Optional query: ?level=Beginner
router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.level) filter.level = req.query.level

    const courses = await Course.find(filter).sort('order')
    res.json(courses)
  } catch (err) {
    if (err.name === 'MongoNotConnectedError' || err.name === 'MongoServerSelectionError') {
      return res.status(503).json({ error: 'MongoDB is not running. Install MongoDB or use Atlas — see README.' })
    }
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/courses/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ error: 'Course not found' })
    res.json(course)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
