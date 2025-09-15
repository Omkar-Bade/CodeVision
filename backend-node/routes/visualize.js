const express = require('express')
const axios   = require('axios')

const router = express.Router()

/**
 * POST /api/visualize
 * Body: { code: string }
 *
 * Forwards the request to the Python FastAPI execution service
 * and returns its response directly to the frontend.
 * This keeps the frontend pointing to a single API origin.
 */
router.post('/', async (req, res) => {
  const { code } = req.body

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code field is required and must be a string' })
  }

  const pythonUrl = `${process.env.PYTHON_API_URL}/execute`

  try {
    const { data } = await axios.post(pythonUrl, { code }, {
      timeout: 15_000,   // 15 s — generous for slow machines
    })
    res.json(data)
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
      return res.status(503).json({
        error:
          'Cannot reach the Python execution service.\n\n' +
          'Start it with:\n  cd backend\n  python -m uvicorn main:app --reload',
      })
    }
    const status = err.response?.status ?? 500
    const detail = err.response?.data?.detail ?? err.message
    res.status(status).json({ error: detail })
  }
})

module.exports = router
