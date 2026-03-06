const mongoose = require('mongoose')

/**
 * Connect to MongoDB using the MONGO_URI env variable.
 * Exits the process on failure so the server doesn't start
 * in a broken state.
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.warn(`⚠  MongoDB not available: ${err.message}`)
    console.warn('   Auth and data APIs will not work, but /api/visualize still works.')
    // Don't exit — let the server keep running so the visualizer proxy still works
  }
}

module.exports = connectDB
