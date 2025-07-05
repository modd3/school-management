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
  
    examType: { // New field to explicitly specify exam type
        type: String,
        enum: ['Opener', 'Midterm', 'Endterm'], // Enforce valid exam types
        required: true
    },
    marksObtained: { // Marks obtained in the exam
        type: Number,
        required: true,
        min: 0,
        max: 100 // Assuming marks are out of 100
    },
    outOf: { type: Number, required: true },
    percentage: { type: Number },
    grade: { type: String },
    points: { type: Number },
    comment: { type: String },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' } // Field to reference the teacher who entered the result
    // ... other fields (e.g., grade, comments) ...
}, { timestamps: true });

// Pre-save hook to calculate totalMarks (example)
resultSchema.pre('save', function(next) {
    this.totalMarks = (this.cat1 || 0) + (this.cat2 || 0) + (this.endterm || 0);
    next();
});

module.exports = mongoose.model('Result', resultSchema);