const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  classSubject: { // References the link between class, subject, and teacher
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassSubject',
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  term: { // This should now be a number (e.g., 1, 2, 3) to align with the AcademicCalendar
    type: Number,
    required: true,
  },

  // Detailed marks breakdown from the plan
  assessments: {
    cat1: {
      marks: { type: Number },
      maxMarks: { type: Number },
      date: { type: Date },
      status: { type: String, enum: ["present", "absent", "excused"], default: "present" }
    },
    cat2: {
      marks: { type: Number },
      maxMarks: { type: Number },
      date: { type: Date },
      status: { type: String, enum: ["present", "absent", "excused"], default: "present" }
    },
    endterm: {
      marks: { type: Number },
      maxMarks: { type: Number },
      date: { type: Date },
      status: { type: String, enum: ["present", "absent", "excused"], default: "present" }
    }
  },

  // Calculated fields
  totalMarks: { type: Number },
  percentage: { type: Number },
  grade: { type: String },
  points: { type: Number },

  // Additional info from the plan
  teacherComments: { type: String },
  classTeacherComments: { type: String },
  position: { type: Number }, // Position in subject
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

// The old pre-save hook for calculation is removed.
// This logic should be moved to a service/controller that can handle the new complex assessment structure
// and use the appropriate GradingScale.

resultSchema.index({ student: 1, classSubject: 1, academicYear: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
