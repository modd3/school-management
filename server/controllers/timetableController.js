const Timetable = require('../models/Timetable');
const Class = require('../models/Class');
const User = require('../models/User');
const Subject = require('../models/Subject');
const AcademicCalendar = require('../models/AcademicCalendar');
const asyncHandler = require('express-async-handler');

// @desc    Create or update a timetable
// @route   POST /api/timetable
// @access  Private (Admin)
exports.createOrUpdateTimetable = asyncHandler(async (req, res) => {
    const { classId, academicYear, termNumber, schedule } = req.body;
    const createdBy = req.user._id;

    // Basic validation
    if (!classId || !academicYear || !termNumber || !schedule || schedule.length === 0) {
        return res.status(400).json({ message: 'Missing required fields: classId, academicYear, termNumber, and schedule.' });
    }

    // Check if class exists
    const existingClass = await Class.findById(classId);
    if (!existingClass) {
        return res.status(404).json({ message: 'Class not found.' });
    }

    let timetable = await Timetable.findOne({ class: classId, academicYear, termNumber });

    if (timetable) {
        // Update existing timetable
        timetable.schedule = schedule;
        timetable.lastModifiedBy = createdBy;
        await timetable.save();
        res.status(200).json({ message: 'Timetable updated successfully.', timetable });
    } else {
        // Create new timetable
        timetable = new Timetable({
            class: classId,
            academicYear,
            termNumber,
            schedule,
            createdBy,
            lastModifiedBy: createdBy
        });
        await timetable.save();
        res.status(201).json({ message: 'Timetable created successfully.', timetable });
    }
});

// @desc    Get class timetable
// @route   GET /api/timetable/class/:classId/:academicYear/:termNumber
// @access  Private (Admin, Teacher, Student, Parent)
exports.getClassTimetable = asyncHandler(async (req, res) => {
    const { classId, academicYear, termNumber } = req.params;

    const timetable = await Timetable.findOne({ class: classId, academicYear, termNumber })
        .populate('class', 'name')
        .populate({
            path: 'schedule.periods.subject',
            select: 'name code'
        })
        .populate({
            path: 'schedule.periods.teacher',
            select: 'firstName lastName'
        })
        .lean();

    if (!timetable) {
        return res.status(404).json({ message: 'Timetable not found for this class, academic year, and term.' });
    }

    res.status(200).json({ success: true, timetable });
});

// @desc    Get teacher's timetable
// @route   GET /api/timetable/teacher/:teacherId/:academicYear/:termNumber
// @access  Private (Admin, Teacher)
exports.getTeacherTimetable = asyncHandler(async (req, res) => {
    const { teacherId, academicYear, termNumber } = req.params;

    // Find all timetables that include this teacher for the given academic year and term
    const timetables = await Timetable.find({
        academicYear,
        termNumber,
        'schedule.periods.teacher': teacherId
    })
    .populate('class', 'name')
    .populate({
        path: 'schedule.periods.subject',
        select: 'name code'
    })
    .populate({
        path: 'schedule.periods.teacher',
        select: 'firstName lastName'
    })
    .lean();

    if (!timetables || timetables.length === 0) {
        return res.status(404).json({ message: 'No timetable found for this teacher for the specified academic year and term.' });
    }

    // Aggregate periods for the specific teacher
    const teacherSchedule = [];
    timetables.forEach(timetable => {
        timetable.schedule.forEach(daySchedule => {
            daySchedule.periods.forEach(period => {
                if (period.teacher && period.teacher._id.toString() === teacherId) {
                    teacherSchedule.push({
                        class: timetable.class.name,
                        day: daySchedule.day,
                        periodNumber: period.periodNumber,
                        startTime: period.startTime,
                        endTime: period.endTime,
                        subject: period.subject,
                        room: period.room
                    });
                }
            });
        });
    });

    // Sort by day and then by start time
    const sortedTeacherSchedule = teacherSchedule.sort((a, b) => {
        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayComparison = daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
        if (dayComparison !== 0) return dayComparison;
        return a.startTime.localeCompare(b.startTime);
    });

    res.status(200).json({ success: true, schedule: sortedTeacherSchedule });
});
