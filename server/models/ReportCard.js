const mongoose = require('mongoose');

const reportCardSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term', required: true },
    results: [{ // Array of results for each subject this term
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        marksObtained: Number,
        grade: String,
        points: Number, // Include points here for easy aggregation
        comment: String
    }],
    totalPoints: { type: Number, default: 0 }, // NEW: Sum of points from all subjects
    meanGradePoint: { type: Number }, // NEW: totalPoints / numberOfSubjects
    overallGrade: { type: String }, // NEW: Calculated from meanGradePoint
    averageMarks: { type: Number, default: 0 }, // Mean of marks (Sum of marks / Number of subjects)
    classPosition: { type: Number },
    streamPosition: { type: Number },
    classTeacherComment: { type: String },
    principalComment: { type: String },
    publishedAt: { type: Date },
    isPublished: { type: Boolean, default: false },
    closingDate: { type: Date }, // From the report form
    openingDate: { type: Date }  // From the report form
}, { timestamps: true });

reportCardSchema.index({ student: 1, term: 1 }, { unique: true });
