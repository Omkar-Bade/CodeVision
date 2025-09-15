const mongoose = require('mongoose')

// Individual lesson inside a course
const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  mins:  { type: Number, required: true },
}, { _id: false })

const courseSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: [true, 'Course title is required'],
      trim:     true,
    },
    description: {
      type:     String,
      required: [true, 'Course description is required'],
    },
    level: {
      type:     String,
      enum:     ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    duration: {
      type:     String,
      required: true,
    },
    icon: {
      type:    String,
      default: '📘',
    },
    topics:  { type: [String], default: [] },
    lessons: { type: [lessonSchema], default: [] },
    order:   { type: Number, default: 0 },   // for sorted listing
  },
  { timestamps: true }
)

module.exports = mongoose.model('Course', courseSchema)
