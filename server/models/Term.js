const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Term 1", "Term 2"
    academicYear: { type: String, required: true }, // e.g., "2024/2025"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false } // To easily identify the active term
}, { timestamps: true });

module.exports = mongoose.model('Term', termSchema);
