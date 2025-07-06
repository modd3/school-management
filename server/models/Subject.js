const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        unique: false, // Allow multiple subjects with the same name
        maxlength: [100, 'Subject name cannot be more than 100 characters'],
        minlength: [2, 'Subject name must be at least 2 characters'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Subject code is required'],
        unique: true,
        trim: true
    },
    assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    assignedTeachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);