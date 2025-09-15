const express = require('express')
const Note    = require('../models/Note')

const router = express.Router()

// ── GET /api/notes ────────────────────────────────────────────
// Returns all notes sorted by order.
// Optional queries: ?category=Fundamentals  |  ?search=loops
router.get('/', async (req, res) => {
  try {
    const filter = {}

    if (req.query.category) filter.category = req.query.category

    if (req.query.search) {
      // Simple case-insensitive title / summary search
      const re = new RegExp(req.query.search, 'i')
      filter.$or = [{ title: re }, { summary: re }]
    }

    const notes = await Note.find(filter).sort('order')
    res.json(notes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/notes/:id ────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) return res.status(404).json({ error: 'Note not found' })
    res.json(note)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
