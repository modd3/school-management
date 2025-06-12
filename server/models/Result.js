const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    term: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Term',
        required: true
    },
    cat1: { // Cat 1 marks
        type: Number,
        default: 0
    },
    cat2: { // Cat 2 marks
        type: Number,
        default: 0
    },
    endterm: { // End-term exam marks
        type: Number,
        default: 0
    },
    examType: { // New field to explicitly specify exam type
        type: String,
        enum: ['cat1', 'cat2', 'endterm'], // Enforce valid exam types
        required: true
    },
    totalMarks: { // Calculated total marks
        type: Number
    },
    // ... other fields (e.g., grade, comments) ...
}, { timestamps: true });

// Pre-save hook to calculate totalMarks (example)
resultSchema.pre('save', function(next) {
    this.totalMarks = (this.cat1 || 0) + (this.cat2 || 0) + (this.endterm || 0);
    next();
});

module.exports = mongoose.model('Result', resultSchema);