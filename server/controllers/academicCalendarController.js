const asyncHandler = require('express-async-handler');
const AcademicCalendar = require('../models/AcademicCalendar');

// @desc    Get all academic calendars
// @route   GET /api/academic-calendars
// @access  Private (Admin, Teacher, Student, Parent)
exports.getAcademicCalendars = asyncHandler(async (req, res) => {
    // Fetch all calendars and sort by academic year descending to show the most recent first
    const calendars = await AcademicCalendar.find({}).sort({ academicYear: -1 }).lean();

    if (!calendars) {
        return res.status(404).json({ message: 'No academic calendars found.' });
    }

    res.status(200).json(calendars);
});

// You can add more functions here later for creating, updating, or deleting calendars.