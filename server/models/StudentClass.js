const mongoose = require('mongoose');

const studentClassSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'Transferred', 'Dropped', 'Graduated'],
    default: 'Active',
  },
  previousClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  promotionStatus: {
    type: String,
    enum: ['Promoted', 'Repeated', 'Pending', 'New'],
    default: 'New',
  },
  isClassRepresentative: {
    type: Boolean,
    default: false,
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSubject'
  }],
}, { timestamps: true });

studentClassSchema.index({ student: 1, class: 1, academicYear: 1 }, { unique: true });
studentClassSchema.index({ class: 1, rollNumber: 1, academicYear: 1 }, { unique: true });
studentClassSchema.index({ class: 1, academicYear: 1, status: 1 });

module.exports = mongoose.model('StudentClass', studentClassSchema);

// This model represents the relationship between students and classes, including their academic year, roll number, and status.
// It allows for tracking student enrollment, class representation, and academic progress within a specific class and academic year.