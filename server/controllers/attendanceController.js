// controllers/attendanceController.js - Enhanced Version
const Attendance = require('../models/Attendance');
//const AttendanceSummary = require('../models/AttendanceSummary');
const Student = require('../models/Student');
const Class = require('../models/Class');
const AcademicCalendar = require('../models/AcademicCalendar');
const User = require('../models/User');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// @desc    Mark attendance for multiple students (bulk operation)
// @route   POST /api/attendance/bulk-mark
// @access  Private (Teacher, Admin)
async function bulkMarkAttendance(req, res) {
    const { 
        classId, 
        subjectId, 
        date, 
        academicYear, 
        termNumber, 
        attendanceData,
        period,
        remarks 
    } = req.body;
    
    const markedBy = req.user._id;

    // Validation
    if (!classId || !date || !academicYear || !termNumber || !Array.isArray(attendanceData)) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: classId, date, academicYear, termNumber, attendanceData',
            required: ['classId', 'date', 'academicYear', 'termNumber', 'attendanceData']
        });
    }

    // Validate date is not in future
    const attendanceDate = new Date(date);
    if (attendanceDate > new Date()) {
        return res.status(400).json({
            success: false,
            message: 'Cannot mark attendance for future dates'
        });
    }

    // Check if marking is allowed for this date
    const activeCalendar = await AcademicCalendar.getActiveYear();
    if (activeCalendar && activeCalendar.isHoliday(attendanceDate)) {
        return res.status(400).json({
            success: false,
            message: 'Cannot mark attendance on holidays',
            holiday: activeCalendar.isHoliday(attendanceDate)
        });
    }

    const results = [];
    const errors = [];
    const normalizedDate = new Date(attendanceDate.setHours(0, 0, 0, 0));

    try {
        // Process each student's attendance
        for (const data of attendanceData) {
            const { studentId, status, studentRemarks } = data;

            try {
                // Validate individual record
                if (!studentId || !status) {
                    errors.push(`Student ${studentId || 'unknown'}: Missing studentId or status`);
                    continue;
                }

                if (!['present', 'absent', 'late', 'excused'].includes(status)) {
                    errors.push(`Student ${studentId}: Invalid status. Must be: present, absent, late, excused`);
                    continue;
                }

                // Check if attendance already exists
                let attendance = await Attendance.findOne({
                    student: studentId,
                    class: classId,
                    subject: subjectId || null,
                    date: normalizedDate,
                    academicYear,
                    termNumber
                });

                if (attendance) {
                    // Update existing record
                    const oldStatus = attendance.status;
                    attendance.status = status;
                    attendance.remarks = studentRemarks || attendance.remarks;
                    attendance.markedBy = markedBy;
                    attendance.period = period || attendance.period;
                    attendance.lastModified = new Date();
                    
                    await attendance.save();
                    
                    results.push({
                        studentId,
                        status: 'updated',
                        oldStatus,
                        newStatus: status,
                        action: 'Updated existing record'
                    });
                } else {
                    // Create new record
                    attendance = new Attendance({
                        student: studentId,
                        class: classId,
                        subject: subjectId,
                        date: normalizedDate,
                        status,
                        remarks: studentRemarks,
                        markedBy,
                        academicYear,
                        termNumber,
                        period: period || 1
                    });
                    
                    await attendance.save();
                    
                    results.push({
                        studentId,
                        status: 'created',
                        newStatus: status,
                        action: 'Created new record'
                    });
                }

                // Update attendance summary asynchronously
                updateAttendanceSummary(studentId, academicYear, termNumber);

            } catch (error) {
                errors.push(`Student ${studentId}: ${error.message}`);
            }
        }

        res.status(200).json({
            success: true,
            message: `Bulk attendance marking completed. ${results.length} successful, ${errors.length} errors.`,
            data: {
                processed: results,
                errors: errors,
                summary: {
                    total: attendanceData.length,
                    successful: results.length,
                    failed: errors.length,
                    date: normalizedDate,
                    class: classId
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing bulk attendance',
            error: error.message
        });
    }
}

// @desc    Get enhanced attendance analytics for a student
// @route   GET /api/attendance/student/:studentId/analytics
// @access  Private (Student, Parent, Teacher, Admin)
async function getStudentAttendanceAnalytics(req, res) {
    const { studentId } = req.params;
    const { academicYear, termNumber, startDate, endDate } = req.query;

    // Authorization check
    if (req.user.role === 'student' && req.user.profileId !== studentId) {
        return res.status(403).json({ message: 'Students can only view their own attendance' });
    }

    if (req.user.role === 'parent') {
        if (!req.user.children.includes(studentId)) {
            return res.status(403).json({ message: 'Parents can only view their children\'s attendance' });
        }
    }

    // Build query
    const query = { student: studentId };
    if (academicYear) query.academicYear = academicYear;
    if (termNumber) query.termNumber = termNumber;
    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const attendanceRecords = await Attendance.find(query)
        .populate('class', 'name')
        .populate('subject', 'name')
        .sort({ date: -1 })
        .lean();

    // Calculate comprehensive analytics
    const analytics = {
        overview: {
            totalRecords: attendanceRecords.length,
            present: attendanceRecords.filter(r => r.status === 'present').length,
            absent: attendanceRecords.filter(r => r.status === 'absent').length,
            late: attendanceRecords.filter(r => r.status === 'late').length,
            excused: attendanceRecords.filter(r => r.status === 'excused').length
        },
        percentages: {},
        trends: {},
        patterns: {},
        alerts: []
    };

    if (analytics.overview.totalRecords > 0) {
        analytics.percentages = {
            present: ((analytics.overview.present / analytics.overview.totalRecords) * 100).toFixed(1),
            absent: ((analytics.overview.absent / analytics.overview.totalRecords) * 100).toFixed(1),
            late: ((analytics.overview.late / analytics.overview.totalRecords) * 100).toFixed(1),
            excused: ((analytics.overview.excused / analytics.overview.totalRecords) * 100).toFixed(1),
            attendance: (((analytics.overview.present + analytics.overview.late + analytics.overview.excused) / analytics.overview.totalRecords) * 100).toFixed(1)
        };

        // Analyze trends (comparing recent vs earlier periods)
        const midPoint = Math.floor(attendanceRecords.length / 2);
        const recent = attendanceRecords.slice(0, midPoint);
        const earlier = attendanceRecords.slice(midPoint);

        if (recent.length > 0 && earlier.length > 0) {
            const recentAttendanceRate = ((recent.filter(r => ['present', 'late', 'excused'].includes(r.status)).length) / recent.length) * 100;
            const earlierAttendanceRate = ((earlier.filter(r => ['present', 'late', 'excused'].includes(r.status)).length) / earlier.length) * 100;
            
            analytics.trends = {
                direction: recentAttendanceRate > earlierAttendanceRate ? 'improving' : 
                          recentAttendanceRate < earlierAttendanceRate ? 'declining' : 'stable',
                change: (recentAttendanceRate - earlierAttendanceRate).toFixed(1),
                recentRate: recentAttendanceRate.toFixed(1),
                previousRate: earlierAttendanceRate.toFixed(1)
            };
        }

        // Identify patterns
        analytics.patterns = analyzeAttendancePatterns(attendanceRecords);

        // Generate alerts
        analytics.alerts = generateAttendanceAlerts(analytics);
    }

    // Calculate attendance summary
    const summary = {
        totalDays: analytics.overview.totalRecords,
        presentDays: analytics.overview.present,
        absentDays: analytics.overview.absent,
        lateDays: analytics.overview.late,
        excusedDays: analytics.overview.excused,
        attendancePercentage: analytics.percentages.attendance || 0
    };

    res.status(200).json({
        success: true,
        data: {
            student: studentId,
            analytics,
            summary,
            records: attendanceRecords.slice(0, 50) // Limit recent records
        }
    });
}

// @desc    Get class attendance analytics with insights
// @route   GET /api/attendance/class/:classId/analytics
// @access  Private (Teacher, Admin)
async function getClassAttendanceAnalytics(req, res) {
    const { classId } = req.params;
    const { academicYear, termNumber, period, subjectId } = req.query;

    // Authorization check for teachers
    if (req.user.role === 'teacher') {
        const teacherClass = await Class.findOne({ classTeacher: req.user._id }).lean();
        if (!teacherClass || teacherClass._id.toString() !== classId) {
            return res.status(403).json({ 
                message: 'Teachers can only view attendance for their assigned classes' 
            });
        }
    }

    // Build query
    const query = { class: classId };
    if (academicYear) query.academicYear = academicYear;
    if (termNumber) query.termNumber = termNumber;
    if (period) query.period = period;
    if (subjectId) query.subject = subjectId;

    const attendanceRecords = await Attendance.find(query)
        .populate('student', 'firstName lastName admissionNumber')
        .populate('subject', 'name')
        .sort({ date: -1 })
        .lean();

    // Group by student for analysis
    const studentAttendance = {};
    attendanceRecords.forEach(record => {
        const studentId = record.student._id.toString();
        if (!studentAttendance[studentId]) {
            studentAttendance[studentId] = {
                student: record.student,
                records: [],
                summary: {
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0
                }
            };
        }
        
        studentAttendance[studentId].records.push(record);
        studentAttendance[studentId].summary[record.status]++;
        studentAttendance[studentId].summary.total++;
    });

    // Calculate analytics for each student
    const studentAnalytics = Object.values(studentAttendance).map(student => {
        const attendanceRate = student.summary.total > 0 ? 
            (((student.summary.present + student.summary.late + student.summary.excused) / student.summary.total) * 100) : 0;
        
        return {
            student: student.student,
            attendanceRate: attendanceRate.toFixed(1),
            summary: student.summary,
            risk: attendanceRate < 75 ? 'high' : attendanceRate < 85 ? 'medium' : 'low',
            consecutiveAbsences: calculateConsecutiveAbsences(student.records)
        };
    });

    // Sort by attendance rate (lowest first for attention)
    studentAnalytics.sort((a, b) => parseFloat(a.attendanceRate) - parseFloat(b.attendanceRate));

    // Class-level analytics
    const classAnalytics = {
        overview: {
            totalStudents: Object.keys(studentAttendance).length,
            averageAttendanceRate: studentAnalytics.length > 0 ? 
                (studentAnalytics.reduce((sum, s) => sum + parseFloat(s.attendanceRate), 0) / studentAnalytics.length).toFixed(1) : 0,
            totalRecords: attendanceRecords.length
        },
        riskDistribution: {
            high: studentAnalytics.filter(s => s.risk === 'high').length,
            medium: studentAnalytics.filter(s => s.risk === 'medium').length,
            low: studentAnalytics.filter(s => s.risk === 'low').length
        },
        trends: calculateClassAttendanceTrends(attendanceRecords),
        alerts: generateClassAttendanceAlerts(studentAnalytics)
    };

    res.status(200).json({
        success: true,
        data: {
            classAnalytics,
            studentAnalytics,
            period: {
                academicYear,
                termNumber,
                period,
                subjectId
            }
        }
    });
}

// @desc    Generate attendance report for multiple classes
// @route   GET /api/attendance/report
// @access  Private (Admin)
async function generateAttendanceReport(req, res) {
    const { 
        academicYear, 
        termNumber, 
        classIds, 
        startDate, 
        endDate,
        format = 'json' 
    } = req.query;

    if (!academicYear || !termNumber) {
        return res.status(400).json({
            success: false,
            message: 'Academic year and term number are required'
        });
    }

    // Build query
    const query = { academicYear, termNumber };
    if (classIds) {
        query.class = { $in: classIds.split(',') };
    }
    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const attendanceData = await Attendance.find(query)
        .populate('student', 'firstName lastName admissionNumber')
        .populate('class', 'name grade')
        .populate('subject', 'name')
        .sort({ 'class.name': 1, date: -1 })
        .lean();

    // Group by class
    const classReports = {};
    attendanceData.forEach(record => {
        const classId = record.class._id.toString();
        if (!classReports[classId]) {
            classReports[classId] = {
                class: record.class,
                students: {},
                summary: {
                    totalRecords: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0
                }
            };
        }

        const studentId = record.student._id.toString();
        if (!classReports[classId].students[studentId]) {
            classReports[classId].students[studentId] = {
                student: record.student,
                attendance: []
            };
        }

        classReports[classId].students[studentId].attendance.push(record);
        classReports[classId].summary.totalRecords++;
        classReports[classId].summary[record.status]++;
    });

    // Calculate rates for each class
    Object.values(classReports).forEach(classReport => {
        const total = classReport.summary.totalRecords;
        classReport.summary.attendanceRate = total > 0 ? 
            (((classReport.summary.present + classReport.summary.late + classReport.summary.excused) / total) * 100).toFixed(1) : 0;
        classReport.summary.absenteeismRate = total > 0 ? 
            ((classReport.summary.absent / total) * 100).toFixed(1) : 0;
    });

    if (format === 'csv') {
        // Generate CSV format
        const csvData = generateAttendanceCSV(classReports);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${academicYear}-term${termNumber}.csv"`);
        return res.send(csvData);
    }

    res.status(200).json({
        success: true,
        data: {
            period: { academicYear, termNumber, startDate, endDate },
            summary: {
                totalClasses: Object.keys(classReports).length,
                totalRecords: attendanceData.length,
                overallAttendanceRate: calculateOverallAttendanceRate(classReports)
            },
            classReports: Object.values(classReports)
        }
    });
}

// Helper Functions

async function updateAttendanceSummary(studentId, academicYear, termNumber) {
    try {
        const attendanceRecords = await Attendance.find({
            student: studentId,
            academicYear,
            termNumber
        }).lean();

        if (attendanceRecords.length === 0) return;

        const summary = {
            totalDays: attendanceRecords.length,
            presentDays: attendanceRecords.filter(r => r.status === 'present').length,
            absentDays: attendanceRecords.filter(r => r.status === 'absent').length,
            lateDays: attendanceRecords.filter(r => r.status === 'late').length,
            excusedDays: attendanceRecords.filter(r => r.status === 'excused').length
        };

        summary.attendancePercentage = summary.totalDays > 0 ? 
            (((summary.presentDays + summary.lateDays + summary.excusedDays) / summary.totalDays) * 100) : 0;

        // AttendanceSummary model not implemented yet
        // await AttendanceSummary.findOneAndUpdate(
        //     { student: studentId, academicYear, termNumber },
        //     summary,
        //     { upsert: true, new: true }
        // );
    } catch (error) {
        console.error('Error updating attendance summary:', error);
    }
}

function analyzeAttendancePatterns(records) {
    if (records.length < 7) return {};

    // Analyze day-of-week patterns
    const dayPatterns = {};
    records.forEach(record => {
        const day = new Date(record.date).getDay();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
        if (!dayPatterns[dayName]) {
            dayPatterns[dayName] = { present: 0, absent: 0, total: 0 };
        }
        dayPatterns[dayName][record.status === 'present' ? 'present' : 'absent']++;
        dayPatterns[dayName].total++;
    });

    // Find most problematic day
    let mostProblematicDay = null;
    let highestAbsenteeism = 0;
    Object.keys(dayPatterns).forEach(day => {
        const pattern = dayPatterns[day];
        const absenteeismRate = pattern.total > 0 ? (pattern.absent / pattern.total) : 0;
        if (absenteeismRate > highestAbsenteeism) {
            highestAbsenteeism = absenteeismRate;
            mostProblematicDay = day;
        }
    });

    return {
        dayPatterns,
        mostProblematicDay,
        highestAbsenteeismRate: (highestAbsenteeism * 100).toFixed(1)
    };
}

function generateAttendanceAlerts(analytics) {
    const alerts = [];
    
    if (parseFloat(analytics.percentages.attendance) < 75) {
        alerts.push({
            level: 'critical',
            message: `Low attendance rate: ${analytics.percentages.attendance}%`,
            action: 'Immediate intervention required'
        });
    } else if (parseFloat(analytics.percentages.attendance) < 85) {
        alerts.push({
            level: 'warning',
            message: `Below average attendance: ${analytics.percentages.attendance}%`,
            action: 'Monitor closely and provide support'
        });
    }

    if (parseFloat(analytics.percentages.late) > 20) {
        alerts.push({
            level: 'warning',
            message: `High tardiness rate: ${analytics.percentages.late}%`,
            action: 'Address punctuality issues'
        });
    }

    if (analytics.trends && analytics.trends.direction === 'declining') {
        alerts.push({
            level: 'warning',
            message: `Declining attendance trend: ${analytics.trends.change}% decrease`,
            action: 'Investigate causes and intervene'
        });
    }

    return alerts;
}

function generateClassAttendanceAlerts(studentAnalytics) {
    const alerts = [];
    
    const highRiskStudents = studentAnalytics.filter(s => s.risk === 'high');
    if (highRiskStudents.length > 0) {
        alerts.push({
            level: 'critical',
            message: `${highRiskStudents.length} students with high absenteeism risk`,
            students: highRiskStudents.slice(0, 5).map(s => s.student.firstName + ' ' + s.student.lastName),
            action: 'Immediate intervention required'
        });
    }

    const chronicAbsentees = studentAnalytics.filter(s => s.consecutiveAbsences >= 3);
    if (chronicAbsentees.length > 0) {
        alerts.push({
            level: 'warning',
            message: `${chronicAbsentees.length} students with consecutive absences`,
            students: chronicAbsentees.slice(0, 5).map(s => s.student.firstName + ' ' + s.student.lastName),
            action: 'Contact parents/guardians'
        });
    }

    return alerts;
}

function calculateConsecutiveAbsences(records) {
    if (records.length === 0) return 0;
    
    // Sort by date (most recent first)
    const sortedRecords = records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let consecutive = 0;
    for (const record of sortedRecords) {
        if (record.status === 'absent') {
            consecutive++;
        } else {
            break;
        }
    }
    
    return consecutive;
}

function calculateClassAttendanceTrends(records) {
    if (records.length < 10) return {};
    
    // Group by week
    const weeklyData = {};
    records.forEach(record => {
        const date = new Date(record.date);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { present: 0, absent: 0, total: 0 };
        }
        
        weeklyData[weekKey][record.status === 'present' ? 'present' : 'absent']++;
        weeklyData[weekKey].total++;
    });
    
    // Calculate weekly attendance rates
    const weeks = Object.keys(weeklyData).sort();
    const weeklyRates = weeks.map(week => {
        const data = weeklyData[week];
        return {
            week,
            rate: data.total > 0 ? (data.present / data.total) * 100 : 0
        };
    });
    
    // Determine trend
    if (weeklyRates.length >= 2) {
        const recent = weeklyRates.slice(-3); // Last 3 weeks
        const earlier = weeklyRates.slice(0, -3); // Earlier weeks
        
        const recentAvg = recent.reduce((sum, w) => sum + w.rate, 0) / recent.length;
        const earlierAvg = earlier.length > 0 ? earlier.reduce((sum, w) => sum + w.rate, 0) / earlier.length : recentAvg;
        
        return {
            direction: recentAvg > earlierAvg ? 'improving' : recentAvg < earlierAvg ? 'declining' : 'stable',
            change: (recentAvg - earlierAvg).toFixed(1),
            weeklyRates: weeklyRates.slice(-8) // Last 8 weeks
        };
    }
    
    return { weeklyRates: weeklyRates.slice(-8) };
}

function calculateOverallAttendanceRate(classReports) {
    const totals = Object.values(classReports).reduce((acc, classReport) => {
        acc.present += classReport.summary.present;
        acc.absent += classReport.summary.absent;
        acc.late += classReport.summary.late;
        acc.excused += classReport.summary.excused;
        acc.total += classReport.summary.totalRecords;
        return acc;
    }, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
    
    return totals.total > 0 ? 
        (((totals.present + totals.late + totals.excused) / totals.total) * 100).toFixed(1) : 0;
}

function generateAttendanceCSV(classReports) {
    let csv = 'Class,Student Name,Admission Number,Total Days,Present,Absent,Late,Excused,Attendance Rate\n';
    
    Object.values(classReports).forEach(classReport => {
        Object.values(classReport.students).forEach(studentData => {
            const student = studentData.student;
            const attendance = studentData.attendance;
            
            const summary = {
                total: attendance.length,
                present: attendance.filter(a => a.status === 'present').length,
                absent: attendance.filter(a => a.status === 'absent').length,
                late: attendance.filter(a => a.status === 'late').length,
                excused: attendance.filter(a => a.status === 'excused').length
            };
            
            const rate = summary.total > 0 ? 
                (((summary.present + summary.late + summary.excused) / summary.total) * 100).toFixed(1) : 0;
            
            csv += `"${classReport.class.name}","${student.firstName} ${student.lastName}","${student.admissionNumber}",${summary.total},${summary.present},${summary.absent},${summary.late},${summary.excused},${rate}%\n`;
        });
    });
    
    return csv;
}


// @desc    Mark attendance for a single student (wraps bulk operation)
// @route   POST /api/attendance/mark
// @access  Private (Teacher, Admin)
async function markAttendance(req, res, next) {
    const { studentId, status, remarks } = req.body;
    if (!studentId || !status) {
        return res.status(400).json({ success: false, message: 'studentId and status are required for single entry.' });
    }
    // Adapt the single entry to the format expected by bulkMarkAttendance
    req.body.attendanceData = [{ studentId, status, studentRemarks: remarks }];
    
    // Call the bulk attendance handler
    bulkMarkAttendance(req, res, next);
}

// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/:studentId/:academicYear
// @access  Private
async function getStudentAttendanceHistory(req, res) {
    const { studentId, academicYear } = req.params;
    const records = await Attendance.find({ student: studentId, academicYear }).sort({ date: -1 }).lean();
    res.status(200).json({ success: true, count: records.length, data: records });
}

// @desc    Get a simple attendance summary for a class
// @route   GET /api/attendance/class/:classId/:academicYear
// @access  Private
async function getClassAttendanceSummary(req, res) {
    const { classId, academicYear } = req.params;
    const summary = await Attendance.aggregate([
        { $match: { class: new mongoose.Types.ObjectId(classId), academicYear } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.status(200).json({ success: true, data: summary });
}


module.exports = {
    bulkMarkAttendance: asyncHandler(bulkMarkAttendance),
    getStudentAttendanceAnalytics: asyncHandler(getStudentAttendanceAnalytics),
    getClassAttendanceAnalytics: asyncHandler(getClassAttendanceAnalytics),
    generateAttendanceReport: asyncHandler(generateAttendanceReport),
    markAttendance: asyncHandler(markAttendance),
    getStudentAttendanceHistory: asyncHandler(getStudentAttendanceHistory),
    getClassAttendanceSummary: asyncHandler(getClassAttendanceSummary)
};