const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  stream: [{ type: String }],
  grade: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  }, 
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  maxStudents: {
    type: Number,
    default: 40,
    min: 1,
  },
  academicYear: {
    type: String,
    required: true,
  },
  classCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

classSchema.index({ name: 1, academicYear: 1 });
classSchema.index({ grade: 1, stream: 1 });

classSchema.virtual('currentStudentCount', {
  ref: 'StudentClass',
  localField: '_id',
  foreignField: 'class',
  count: true,
  match: { status: 'Active' }
});

module.exports = mongoose.model('Class', classSchema);
