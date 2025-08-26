const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  otherNames: { type: String },
  admissionNumber: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  parentContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  studentPhotoUrl: { type: String },
  isActive: { type: Boolean, default: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
  }
}, { timestamps: true });

studentSchema.methods.generateAdmissionNumber = async function () {
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

studentSchema.pre('validate', async function (next) {
  if (!this.admissionNumber) {
    this.admissionNumber = await this.generateAdmissionNumber();
  }
  next();
});

studentSchema.virtual('currentClass', {
  ref: 'StudentClass',
  localField: '_id',
  foreignField: 'student',
  justOne: true,
  match: { status: 'Active' }
});

studentSchema.index({ firstName: 1, lastName: 1 });
studentSchema.index({ parentContacts: 1 });
studentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Student', studentSchema);
