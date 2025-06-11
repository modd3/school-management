const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term', required: true },
    marksObtained: { type: Number, required: true, min: 0, max: 100 },
    grade: { type: String },       // e.g., 'A', 'B+'
    points: { type: Number },      // NEW: Points corresponding to the grade (1-12)
    comment: { type: String },     // Teacher's comment for this subject
    // classPosition and streamPosition will be on the ReportCard or calculated dynamically
}, { timestamps: true });
