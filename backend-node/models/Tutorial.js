const mongoose = require('mongoose')

const tutorialSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Tutorial title is required'],
      trim:     true,
    },
    description: {
      type:     String,
      required: [true, 'Tutorial description is required'],
    },
    code: {
      type:     String,
      required: [true, 'Tutorial code is required'],
    },
    level: {
      type:    String,
      enum:    ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    topic: {
      type:    String,
      default: 'Basics',
      trim:    true,
    },
    icon: {
      type:    String,
      default: '💡',
    },
    time: {
      type:    String,
      default: '3 min',
    },
    explanation: {
      type:    [String],
      default: [],
    },
    output: {
      type:    String,
      default: '',
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Tutorial', tutorialSchema)
