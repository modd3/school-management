const AcademicCalendar = require('../models/AcademicCalendar');
const asyncHandler = require('express-async-handler');

// @desc    Create a new academic calendar
// @route   POST /api/academic/calendar
// @access  Private (Admin)
exports.createAcademicCalendar = asyncHandler(async (req, res) => {
    const { academicYear, terms, yearHolidays, settings, status, notes } = req.body;

    // Basic validation
    if (!academicYear || !terms || terms.length === 0) {
        return res.status(400).json({ message: 'Academic year and at least one term are required.' });
    }

    // Check if a calendar for this academic year already exists
    const existingCalendar = await AcademicCalendar.findOne({ academicYear }).lean(); 
    if (existingCalendar) {
        return res.status(400).json({ message: `Academic calendar for ${academicYear} already exists.` });
    }

    const academicCalendar = new AcademicCalendar({
        academicYear,
        terms,
        yearHolidays,
        settings,
        status,
        notes,
        createdBy: req.user._id, // Assuming user ID is available from authentication middleware
    });

    const createdCalendar = await academicCalendar.save();
    res.status(201).json(createdCalendar);
});

// @desc    Get all academic calendars
// @route   GET /api/academic/calendar
// @access  Private (Admin, Teacher, Student, Parent)
exports.getAllAcademicCalendars = asyncHandler(async (req, res) => {
    const calendars = await AcademicCalendar.find({})
        .select('academicYear status terms.termNumber terms.name terms.startDate terms.endDate') // Added .select()
        .sort({ academicYear: -1 })
        .lean(); // Added .lean()
    res.status(200).json(calendars);
});

// @desc    Get academic calendar by academic year
// @route   GET /api/academic/calendar/:academicYear
// @access  Private (Admin, Teacher, Student, Parent)
exports.getAcademicCalendarByYear = asyncHandler(async (req, res) => {
    const { academicYear } = req.params;
    const calendar = await AcademicCalendar.findOne({ academicYear })
        .select('academicYear status terms yearHolidays settings notes') // Added .select()
        .lean(); // Added .lean()

    if (!calendar) {
        return res.status(404).json({ message: 'Academic calendar not found for the specified year.' });
    }
    res.status(200).json(calendar);
});

// @desc    Update an academic calendar
// @route   PUT /api/academic/calendar/:academicYear
// @access  Private (Admin)
exports.updateAcademicCalendar = asyncHandler(async (req, res) => {
    const { academicYear } = req.params;
    const { terms, yearHolidays, settings, status, notes } = req.body;

    const academicCalendar = await AcademicCalendar.findOne({ academicYear });

    if (!academicCalendar) {
        return res.status(404).json({ message: 'Academic calendar not found.' });
    }

    // Update fields
    academicCalendar.terms = terms || academicCalendar.terms;
    academicCalendar.yearHolidays = yearHolidays || academicCalendar.yearHolidays;
    academicCalendar.settings = settings || academicCalendar.settings;
    academicCalendar.status = status || academicCalendar.status;
    academicCalendar.notes = notes || academicCalendar.notes;
    academicCalendar.lastModifiedBy = req.user._id; // Assuming user ID is available

    const updatedCalendar = await academicCalendar.save();
    res.status(200).json(updatedCalendar);
});

// @desc    Delete an academic calendar
// @route   DELETE /api/academic/calendar/:academicYear
// @access  Private (Admin)
exports.deleteAcademicCalendar = asyncHandler(async (req, res) => {
    const { academicYear } = req.params;

    const academicCalendar = await AcademicCalendar.findOne({ academicYear });

    if (!academicCalendar) {
        return res.status(404).json({ message: 'Academic calendar not found.' });
    }

    await academicCalendar.remove(); // Using remove() for Mongoose 5.x, deleteOne() for 6.x+
    res.status(200).json({ message: 'Academic calendar removed successfully.' });
});

// @desc    Set an academic calendar as active
// @route   PUT /api/academic/calendar/:academicYear/set-active
// @access  Private (Admin)
exports.setActiveAcademicCalendar = asyncHandler(async (req, res) => {
    const { academicYear } = req.params;

    // Deactivate all other calendars
    await AcademicCalendar.updateMany({ status: 'active' }, { $set: { status: 'archived' } });

    // Set the specified calendar as active
    const academicCalendar = await AcademicCalendar.findOneAndUpdate(
        { academicYear },
        { $set: { status: 'active' } },
        { new: true }
    ).lean(); // Added .lean()

    if (!academicCalendar) {
        return res.status(404).json({ message: 'Academic calendar not found.' });
    }

    res.status(200).json({ message: 'Academic calendar set as active.', academicCalendar });
});

// @desc    Get the current active academic calendar
// @route   GET /api/academic/calendar/active
// @access  Public (or Private based on need)
exports.getActiveAcademicCalendar = asyncHandler(async (req, res) => {
    const activeCalendar = await AcademicCalendar.findOne({ status: 'active' })
        .select('academicYear status terms yearHolidays settings notes') // Added .select()
        .lean(); // Added .lean()

    if (!activeCalendar) {
        return res.status(404).json({ message: 'No active academic calendar found.' });
    }

    res.status(200).json(activeCalendar);
});