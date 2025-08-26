const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    periodNumber: {
        type: Number,
        required: true,
        min: 1
    },
    startTime: {
        type: String,
        required: true,
        match: /^\d{2}:\d{2}$/ // e.g., "08:00"
    },
    endTime: {
        type: String,
        required: true,
        match: /^\d{2}:\d{2}$/ // e.g., "08:40"
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming teacher is a User
        required: true
    },
    room: {
        type: String,
        trim: true
    }
});

const dayScheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    periods: [periodSchema]
});

const timetableSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    termNumber: {
        type: Number,
        required: true
    },
    schedule: [dayScheduleSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure unique timetable per class per academic year and term
timetableSchema.index({ class: 1, academicYear: 1, termNumber: 1 }, { unique: true });

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
