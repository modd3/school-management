// server/models/GradingScale.js
const mongoose = require('mongoose');

const gradeEntrySchema = new mongoose.Schema({
  grade: { type: String, required: true },
  minMarks: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  points: { type: Number, required: true },
  description: { type: String }
});

const gradingScaleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Primary Grading", "Secondary Grading"
  scale: [gradeEntrySchema],
  isDefault: { type: Boolean, default: false },
  academicLevel: { type: String, enum: ["primary", "secondary", "other"] }
}, { timestamps: true });

module.exports = mongoose.model('GradingScale', gradingScaleSchema);