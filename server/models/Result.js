const mongoose = require('mongoose');
const { calculateGradeAndPoints } = require('../utils/grading');


const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  classSubject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSubject',
    required: true,
  },
  term: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Term',
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  examType: {
    type: String,
    enum: ['Opener', 'Midterm', 'Endterm'],
    required: true,
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0,
  },
  outOf: {
    type: Number,
    required: true,
    min: 1,
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  grade: {
    type: String,
    trim: true,
  },
  points: {
    type: Number,
    min: 0,
  },
  comment: {
    type: String,
    maxlength: 500,
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  lastModified: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

resultSchema.pre('save', function (next) {
  if (this.marksObtained != null && this.outOf) {
    this.percentage = (this.marksObtained / this.outOf) * 100;

    const { grade, points, comment } = calculateGradeAndPoints(this.percentage);

    this.grade = grade;
    this.points = points;

    // Only overwrite comment if one wasn't manually set
    if (!this.comment || this.comment.trim() === '') {
      this.comment = comment;
    }
  }

  this.lastModified = Date.now();
  next();
});

resultSchema.index({ student: 1, classSubject: 1, term: 1, academicYear: 1, examType: 1 }, { unique: true });
resultSchema.index({ classSubject: 1, term: 1, academicYear: 1 });
resultSchema.index({ student: 1, academicYear: 1, term: 1 });

module.exports = mongoose.model('Result', resultSchema);