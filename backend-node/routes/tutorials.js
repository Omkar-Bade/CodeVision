const express  = require('express')
const Tutorial = require('../models/Tutorial')

const router = express.Router()

// ── GET /api/tutorials ────────────────────────────────────────
// Returns all tutorials sorted by order.
// Optional query: ?topic=Loops  |  ?level=Beginner
router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.topic) filter.topic = req.query.topic
    if (req.query.level) filter.level = req.query.level

    const tutorials = await Tutorial.find(filter).sort('order')
    res.json(tutorials)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── GET /api/tutorials/:id ────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const tutorial = await Tutorial.findById(req.params.id)
    if (!tutorial) return res.status(404).json({ error: 'Tutorial not found' })
    res.json(tutorial)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
