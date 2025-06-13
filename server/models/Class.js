const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Form 1", "Form 2"
    streams: [{ type: String }], // e.g., ['A', 'B', 'C'] or ['East', 'West']
    classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // Link to the class teacher
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }] // Link to the students in the class
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);