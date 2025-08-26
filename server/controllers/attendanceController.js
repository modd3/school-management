const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const AcademicCalendar = require('../models/AcademicCalendar');
const asyncHandler = require('express-async-handler');

// @desc    Mark attendance for a student
// @route   POST /api/attendance/mark
// @access  Private (Teacher, Admin)
exports.markAttendance = asyncHandler(async (req, res) => {
    const { studentId, classId, subjectId, date, status, remarks, academicYear, termNumber } = req.body;
    const markedBy = req.user._id; // User marking the attendance

    // Basic validation
    if (!studentId || !classId || !date || !status || !academicYear || !termNumber) {
        return res.status(400).json({ message: 'Missing required fields: studentId, classId, date, status, academicYear, termNumber.' });
    }

    // Check if attendance already exists for this student, class, subject (if provided), and date
    let attendance = await Attendance.findOne({
        student: studentId,
        class: classId,
        subject: subjectId || null, // Handle optional subject
        date: new Date(date).setHours(0, 0, 0, 0), // Normalize date to start of day
        academicYear,
        termNumber
    }).lean(); 

    if (attendance) {
        // Update existing attendance record
        attendance.status = status;
        attendance.remarks = remarks || attendance.remarks;
        attendance.markedBy = markedBy;
        // Convert back to Mongoose document for saving
        attendance = new Attendance(attendance); // Re-instantiate as Mongoose document
        await attendance.save();
        res.status(200).json({ message: 'Attendance updated successfully.', attendance });
    } else {
        // Create new attendance record
        attendance = new Attendance({
            student: studentId,
            class: classId,
            subject: subjectId,
            date: new Date(date).setHours(0, 0, 0, 0), // Normalize date
            status,
            remarks,
            markedBy,
            academicYear,
            termNumber
        });
        await attendance.save();
        res.status(201).json({ message: 'Attendance marked successfully.', attendance });
    }
});

// @desc    Get student attendance history
// @route   GET /api/attendance/student/:studentId/:academicYear
// @access  Private (Student, Parent, Teacher, Admin)
exports.getStudentAttendanceHistory = asyncHandler(async (req, res) => {
    const { studentId, academicYear } = req.params;
    const { termNumber, subjectId } = req.query; // Optional filters

    const filter = {
        student: studentId,
        academicYear
    };
    if (termNumber) filter.termNumber = termNumber;
    if (subjectId) filter.subject = subjectId;

    const attendanceRecords = await Attendance.find(filter)
        .populate('class', 'name')
        .populate('subject', 'name')
        .sort({ date: -1 })
        .lean(); 

    res.status(200).json({ success: true, count: attendanceRecords.length, attendanceRecords });
});

// @desc    Get class attendance summary
// @route   GET /api/attendance/class/:classId/:academicYear
// @access  Private (Teacher, Admin)
exports.getClassAttendanceSummary = asyncHandler(async (req, res) => {
    const { classId, academicYear } = req.params;
    const { termNumber, startDate, endDate } = req.query; // Optional filters

    const filter = {
        class: classId,
        academicYear
    };
    if (termNumber) filter.termNumber = termNumber;
    if (startDate && endDate) {
        filter.date = {
            $gte: new Date(startDate).setHours(0, 0, 0, 0),
            $lte: new Date(endDate).setHours(23, 59, 59, 999)
        };
    }

    const attendanceSummary = await Attendance.aggregate([
        { $match: filter },
        {
            $group: {
                _id: { 
                    student: '$student',
                    status: '$status'
                },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.student',
                attendance: {
                    $push: {
                        status: '$_id.status',
                        count: '$count'
                    }
                },
                totalRecords: { $sum: '$count' }
            }
        },
        {
            $lookup: {
                from: 'students', // The collection name for Student model
                localField: '_id',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        { $unwind: '$studentInfo' },
        {
            $project: {
                _id: 0,
                student: {
                    _id: '$studentInfo._id',
                    firstName: '$studentInfo.firstName',
                    lastName: '$studentInfo.lastName',
                    admissionNumber: '$studentInfo.admissionNumber'
                },
                attendance: 1,
                totalRecords: 1,
                presentCount: {
                    $sum: {
                        $filter: {
                            input: '$attendance',
                            as: 'att',
                            cond: { $eq: ['$$att.status', 'present'] }
                        }
                    }
                },
                absentCount: {
                    $sum: {
                        $filter: {
                            input: '$attendance',
                            as: 'att',
                            cond: { $eq: ['$$att.status', 'absent'] }
                        }
                    }
                },
                lateCount: {
                    $sum: {
                        $filter: {
                            input: '$attendance',
                            as: 'att',
                            cond: { $eq: ['$$att.status', 'late'] }
                        }
                    }
                },
                excusedCount: {
                    $sum: {
                        $filter: {
                            input: '$attendance',
                            as: 'att',
                            cond: { $eq: ['$$att.status', 'excused'] }
                        }
                    }
                },
                attendancePercentage: {
                    $cond: {
                        if: { $gt: ['$totalRecords', 0] },
                        then: {
                            $multiply: [
                                { $divide: [{
                                    $sum: {
                                        $filter: {
                                            input: '$attendance',
                                            as: 'att',
                                            cond: { $in: ['$$att.status', ['present', 'late', 'excused']] }
                                        }
                                    }
                                }, '$totalRecords'] },
                                100
                            ]
                        },
                        else: 0
                    }
                }
            }
        },
        { $sort: { 'student.lastName': 1, 'student.firstName': 1 } }
    ]);

    res.status(200).json({ success: true, count: attendanceSummary.length, summary: attendanceSummary });
});