const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    otherNames: { type: String },
    admissionNumber: { type: String, required: true, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    currentClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Reference to the current class
    stream: { type: String }, // e.g., 'East', 'West', 'North'
    parentContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }], // Array to link multiple parents
    studentPhotoUrl: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
// This model represents a student in the school management system.