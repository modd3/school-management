const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    otherNames: { type: String },
    admissionNumber: { type: String, required: true, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    currentClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Reference to the current class
    parentContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }], // Array to link multiple parents
    studentPhotoUrl: { type: String },
    isActive: { type: Boolean, default: true },
    // Add userId field to link with User model
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        unique: true 
    },
}, { timestamps: true });

// Move generateAdmissionNumber inside the schema definition
studentSchema.methods.generateAdmissionNumber = async function() {
  const currentYear = new Date().getFullYear().toString();
  const lastStudent = await mongoose.model('Student').findOne({
    admissionNumber: new RegExp(`^ADM/${currentYear}/`)
  }).sort({ admissionNumber: -1 });

  let nextId = 1;
  if (lastStudent) {
    const lastNum = parseInt(lastStudent.admissionNumber.split('/')[2], 10);
    nextId = lastNum + 1;
  }
  const paddedId = String(nextId).padStart(3, '0');
  return `ADM/${currentYear}/${paddedId}`;
};

// Update the pre-validate middleware instead of pre-save
studentSchema.pre('validate', async function(next) {
  try {
    if (!this.admissionNumber) {
      this.admissionNumber = await this.generateAdmissionNumber();
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Remove the old pre-save middleware if it exists

module.exports = mongoose.model('Student', studentSchema);
// This model represents a student in the school management system.