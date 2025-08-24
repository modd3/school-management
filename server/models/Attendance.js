const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }, // Optional
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true
  },
  remarks: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYear: { type: String, required: true },
  term: { type: Number, required: true }
}, { timestamps: true });

attendanceSchema.index({ student: 1, date: 1, subject: 1 }, { unique: true });
attendanceSchema.index({ class: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);