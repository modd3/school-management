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

const Result = require('../models/Result');
const AcademicCalendar = require('../models/AcademicCalendar');
const Attendance = require('../models/Attendance');
const GradingScale = require('../models/GradingScale');


// Helper function to perform the actual progress generation
const generateStudentProgress = async (academicYear, student) => {
    if (!student) {
        console.log(`Student not found, skipping.`);
        return null;
    }

    const academicCalendar = await AcademicCalendar.findOne({ academicYear }).lean();
    if (!academicCalendar) {
        throw new Error(`Academic calendar for ${academicYear} not found.`);
    }

    // 1. Fetch all results for the student for the entire academic year
    const studentResults = await Result.find({ student: student._id, academicYear, status: 'published' })
        .populate('subject', 'name')
        .lean();

    if (studentResults.length === 0) {
        console.log(`No published results found for student ${student.firstName} ${student.lastName} in ${academicYear}.`);
        return null;
    }

    // 2. Group results by term
    const resultsByTerm = {};
    academicCalendar.terms.forEach(term => {
        resultsByTerm[term.termNumber] = {
            term,
            results: []
        };
    });
    studentResults.forEach(res => {
        if (resultsByTerm[res.termNumber]) {
            resultsByTerm[res.termNumber].results.push(res);
        }
    });

    const termlyProgress = [];

    // 3. Process each term
    for (const termNumber in resultsByTerm) {
        const termData = resultsByTerm[termNumber];
        if (termData.results.length === 0) continue;

        let termTotalMarks = 0;
        let termTotalMaxMarks = 0;
        let termTotalPoints = 0;

        const subjectPerformance = termData.results.map(res => {
            termTotalMarks += res.totalMarks || 0;
            termTotalMaxMarks += res.totalMaxMarks || 0;
            termTotalPoints += res.overallPoints || 0;

            return {
                subject: res.subject._id,
                totalMarks: res.totalMarks,
                totalMaxMarks: res.totalMaxMarks,
                percentage: res.overallPercentage,
                grade: res.overallGrade,
                points: res.overallPoints,
                position: res.subjectPosition,
                teacherComments: res.teacherComments,
                assessments: { // Flatten assessments for progress report
                    cat1: res.assessments.cat1,
                    cat2: res.assessments.cat2,
                    endterm: res.assessments.endterm,
                }
            };
        });

        const averagePercentage = termTotalMaxMarks > 0 ? (termTotalMarks / termTotalMaxMarks) * 100 : 0;
        const meanGradePoint = subjectPerformance.length > 0 ? termTotalPoints / subjectPerformance.length : 0;
        
        // Get grading scale and calculate overall grade
        const gradingScale = await GradingScale.getDefault('secondary');
        const overallGradeInfo = gradingScale ? gradingScale.getGradeInfo(averagePercentage) : { grade: 'E' };
        const overallGrade = overallGradeInfo.grade;

        // Fetch attendance for the term
        const attendance = await Attendance.findOne({ student: student._id, academicYear, term: termData.term._id }).lean();

        termlyProgress.push({
            termId: `${academicYear}-${termData.term.termNumber}`,
            termName: termData.term.name,
            termNumber: termData.term.termNumber,
            academicYear: academicYear,
            totalMarks: termTotalMarks,
            totalMaxMarks: termTotalMaxMarks,
            totalPoints: termTotalPoints,
            averagePercentage,
            meanGradePoint,
            overallGrade,
            subjectPerformance,
            attendance: attendance ? attendance.summary : {} // Add attendance summary
        });
    }

    // 4. Create or Update StudentProgress Document
    // Get the student's current class from StudentClass model
    const StudentClass = require('../models/StudentClass');
    const studentClass = await StudentClass.findOne({ 
        student: student._id, 
        status: 'Active' 
    }).populate('class').lean();
    
    if (!studentClass) {
        throw new Error(`No active class found for student ${student._id}`);
    }
    
    const progressReport = {
        student: student._id,
        academicYear,
        class: studentClass.class._id,
        termlyProgress,
        lastUpdated: new Date(),
        // Year summary and trends can be calculated here after all terms are processed
    };

    const updatedProgress = await StudentProgress.findOneAndUpdate(
        { student: student._id, academicYear },
        progressReport,
        { new: true, upsert: true }
    );

    // 5. (Future Enhancement) Calculate positions after all reports for a class are generated
    // This is a complex operation that should be done in a separate step

    return updatedProgress;
};


// @desc    Generate progress reports (This would be a complex background task)
// @route   POST /api/progress/generate
// @access  Private (Admin)
exports.generateProgressReports = asyncHandler(async (req, res) => {
    const { academicYear, classId, studentId } = req.body;

    if (!academicYear) {
        return res.status(400).json({ message: 'Academic year is required.' });
    }

    // This endpoint should ideally trigger a background job.
    // For now, it will run synchronously but with a response sent immediately.
    // In a real-world scenario, you'd add this task to a Bull or Agenda queue.
    res.status(202).json({ message: `Progress report generation initiated for ${academicYear}. This may take some time.` });

    // --- Start of the actual logic (to be moved to a background worker) ---
    try {
        console.log(`Starting progress report generation for academic year: ${academicYear}`);
        let studentsToProcess;

        if (studentId) { // Generate for a single student
            studentsToProcess = await Student.find({ _id: studentId, isActive: true }).populate('currentClass');
        } else if (classId) { // Generate for a specific class
            studentsToProcess = await Student.find({ currentClass: classId, isActive: true }).populate('currentClass');
        } else { // Generate for all students
            studentsToProcess = await Student.find({ isActive: true }).populate('currentClass');
        }

        let successCount = 0;
        let errorCount = 0;

        for (const student of studentsToProcess) {
            try {
                await generateStudentProgress(academicYear, student);
                successCount++;
            } catch (err) {
                errorCount++;
                console.error(`Failed to generate progress for student ${student._id}:`, err.message);
            }
        }

        console.log(`Progress report generation finished for ${academicYear}. Success: ${successCount}, Errors: ${errorCount}`);
        // You could emit a socket event or send an email to the admin upon completion.

    } catch (error) {
        console.error('Overall error in progress generation job:', error);
    }
    // --- End of the actual logic ---
});