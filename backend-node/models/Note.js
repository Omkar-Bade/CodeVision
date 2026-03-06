const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Note title is required'],
      trim:     true,
    },
    summary: {
      type:    String,
      default: '',
    },
    content: {
      type:     String,
      required: [true, 'Note content is required'],
    },
    codeExample: {
      type:    String,
      default: '',
    },
    category: {
      type:    String,
      default: 'General',
      trim:    true,
    },
    tags: {
      type:    [String],
      default: [],
    },
    icon: {
      type:    String,
      default: '📄',
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

// Text index for full-text search (used in the search box)
noteSchema.index({ title: 'text', summary: 'text', content: 'text' })

module.exports = mongoose.model('Note', noteSchema)
