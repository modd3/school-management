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
  academicYear: {
    type: String,
    required: true,
  },
  term: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Term',
  required: true
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
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

classSubjectSchema.index({ class: 1, subject: 1, teacher: 1, term: 1, academicYear: 1 }, { unique: true });
classSubjectSchema.index({ teacher: 1, academicYear: 1, term: 1 });

module.exports = mongoose.model('ClassSubject', classSubjectSchema);
