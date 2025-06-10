const teacherSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    otherNames: { type: String },
    staffId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // For direct contact, but auth is via User model
    phoneNumber: { type: String },
    subjectsTaught: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], // Array of subjects they teach
    classTaught: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // If they are a class teacher, reference to the class
    // This `teacherType` field will dictate their specific school role for logic beyond basic 'teacher'
    teacherType: {
        type: String,
        enum: ['principal', 'deputy_principal', 'class_teacher', 'subject_teacher'],
        required: true
    },
    // User ID reference for authentication and unified user management
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }
}, { timestamps: true });
