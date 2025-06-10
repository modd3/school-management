const studentSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    otherNames: { type: String },
    admissionNumber: { type: String, required: true, unique: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    currentClass: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Reference to the current class
    stream: { type: String }, // e.g., 'East', 'West', 'North'
    // parentContactInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }, // Link to parent (can be an array if multiple parents)
    parentContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }], // Array to link multiple parents
    studentPhotoUrl: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
