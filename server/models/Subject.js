const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100,
    minlength: 2,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Core', 'Optional', 'Elective'],
    required: true,
    default: 'Core',
  },
  group: {
    type: String,
    default: null, // e.g., "Group III" — applies only to elective subjects
  },
  creditHours: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

subjectSchema.index({ name: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ isActive: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
