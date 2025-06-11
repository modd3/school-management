const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Mathematics", "English", "Chemistry"
    subjectCode: { type: String, unique: true }, // e.g., "MATH001", "ENG001"
    assignedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }] // Teachers who teach this subject
}, { timestamps: true });
