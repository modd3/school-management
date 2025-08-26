const mongoose = require('mongoose');

const classSubjectSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assistantTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  academicYear: {
    type: String,
    required: true,
  },
  termNumber: {
    type: Number,
    required: true
  },
  maxMarks: {
    cat1: { type: Number, default: 30 },
    cat2: { type: Number, default: 30 },
    endterm: { type: Number, default: 40 }
  },
  gradingScale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GradingScale',
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    startTime: String,
    endTime: String,
    room: String,
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  }
}, { timestamps: true });

classSubjectSchema.index({ class: 1, subject: 1, teacher: 1, termNumber: 1, academicYear: 1 }, { unique: true });
classSubjectSchema.index({ teacher: 1, academicYear: 1, termNumber: 1 });

module.exports = mongoose.model('ClassSubject', classSubjectSchema);