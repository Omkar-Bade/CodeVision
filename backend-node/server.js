require('dotenv').config()

const express    = require('express')
const cors       = require('cors')
const connectDB  = require('./config/db')

// Route modules
const authRoutes      = require('./routes/auth')
const courseRoutes    = require('./routes/courses')
const noteRoutes      = require('./routes/notes')
const tutorialRoutes  = require('./routes/tutorials')
const visualizeRoutes = require('./routes/visualize')

// Connect to MongoDB before starting the server
connectDB()

const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ──────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
}))
app.use(express.json())

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/courses',   courseRoutes)
app.use('/api/notes',     noteRoutes)
app.use('/api/tutorials', tutorialRoutes)
app.use('/api/visualize', visualizeRoutes)

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'CodeVision Node.js API', timestamp: new Date() })
})

// ── 404 handler ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Global error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`CodeVision API running on http://localhost:${PORT}`)
  console.log(`Python execution service expected at ${process.env.PYTHON_API_URL}`)
})
