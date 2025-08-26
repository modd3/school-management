const StudentProgress = require('../models/StudentProgress');
const Student = require('../models/Student');
const Class = require('../models/Class');
const asyncHandler = require('express-async-handler');

// @desc    Get student progress report
// @route   GET /api/progress/:studentId/:academicYear
// @access  Private (Student, Parent, Admin, Teacher)
exports.getStudentProgressReport = asyncHandler(async (req, res) => {
    const { studentId, academicYear } = req.params;

    const studentProgress = await StudentProgress.findOne({ student: studentId, academicYear })
        .populate('student', 'firstName lastName admissionNumber')
        .populate({
            path: 'termlyProgress.subjectPerformance.subject',
            select: 'name'
        })
        .lean();

    if (!studentProgress) {
        return res.status(404).json({ message: 'Student progress report not found.' });
    }

    res.status(200).json(studentProgress);
});

// @desc    Get class progress summary
// @route   GET /api/progress/class/:classId/:academicYear
// @access  Private (Admin, Teacher)
exports.getClassProgressSummary = asyncHandler(async (req, res) => {
    const { classId, academicYear } = req.params;

    // Find all students in the class for the given academic year
    const studentsInClass = await Student.find({ currentClass: classId, academicYear, isActive: true }).select('_id').lean(); // Added .lean()
    const studentIds = studentsInClass.map(s => s._id);

    const classProgress = await StudentProgress.find({ student: { $in: studentIds }, academicYear })
        .populate('student', 'firstName lastName admissionNumber')
        .lean();

    if (!classProgress || classProgress.length === 0) {
        return res.status(404).json({ message: 'No progress data found for this class.' });
    }

    // Basic aggregation for class summary (can be expanded)
    const summary = {
        totalStudents: classProgress.length,
        averageOverallPercentage: classProgress.reduce((sum, sp) => sum + (sp.annualSummary?.averagePercentage || 0), 0) / classProgress.length,
        // Add more summary metrics as needed
    };

    res.status(200).json({ summary, details: classProgress });
});

// @desc    Generate progress reports (This would be a complex background task)
// @route   POST /api/progress/generate
// @access  Private (Admin)
exports.generateProgressReports = asyncHandler(async (req, res) => {
    // This endpoint would trigger a background job to:
    // 1. Iterate through all students.
    // 2. For each student, gather all their results across terms for the academic year.
    // 3. Calculate termly progress (total marks, average percentage, grades, positions).
    // 4. Calculate overall trends (improving/declining subjects).
    // 5. Save/update the StudentProgress document for each student.

    // For now, we'll just return a success message indicating the job has been triggered.
    res.status(202).json({ message: 'Progress report generation initiated. This may take some time.' });
});