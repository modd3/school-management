// server/models/AcademicCalendar.js
const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
});

const examPeriodSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ["CAT 1", "CAT 2", "End Term"] },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
});

const termSchema = new mongoose.Schema({
  termNumber: { type: Number, required: true, enum: [1, 2, 3] },
  name: { type: String, required: true }, // e.g., "Term 1"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  examPeriods: [examPeriodSchema]
});

const academicCalendarSchema = new mongoose.Schema({
  academicYear: { type: String, required: true, unique: true, match: /^\d{4}\/\d{4}$/ }, // e.g., "2024/2025"
  terms: [termSchema],
  holidays: [holidaySchema],
  status: { type: String, required: true, enum: ["active", "archived"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema);