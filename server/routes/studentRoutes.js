const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getStudentResultsForTerm,
    getPublishedResultsForClass,
    getStudentExamReport,
    getFinalReportCard,
    getStudentClassPosition
} = require('../controllers/resultController');
const StudentClass = require('../models/StudentClass');

// Protect all student routes
router.use(protect);
router.use(authorize(['student']));

// Get all results for the logged-in student in a specific term
router.get('/results/term/:termId', (req, res) => {
    // Use req.user.profileId as the studentId
    req.params.studentId = req.user.profileId;
    return getStudentResultsForTerm(req, res);
});

// Get all published results for the student's class in a specific term
router.get('/results/published/term/:termId', async (req, res) => {
    // Fetch student's classId from their profile
    const student = req.user.profile;
    if (!student || !student.currentClass) {
        return res.status(400).json({ message: 'Student class not found' });
    }
    req.params.classId = student.currentClass.toString();
    req.params.termId = req.params.termId;
    return getPublishedResultsForClass(req, res);
});

router.get("/report/:termId/:examType", async (req, res) => {
    // Use the logged-in student's profileId
    req.params.studentId = req.user.profileId;
    
    return getStudentExamReport(req, res);
});

router.get("/final-report/:termId", async (req, res) => {
    const userId = req.user._id; // from auth middleware
    const termId = req.params.termId;

    // Find StudentClass for this student and term
    const studentClass = await StudentClass.findOne({ student: userId, academicYear: req.query.academicYear || undefined, term: termId })
        .populate('class');

    let className = 'N/A';
    let stream = 'N/A';
    let academicYear = 'N/A';

    if (studentClass && studentClass.class) {
        className = studentClass.class.name;
        stream = Array.isArray(studentClass.class.stream) ? studentClass.class.stream.join(', ') : studentClass.class.stream || 'N/A';
        academicYear = studentClass.academicYear || 'N/A';
    }

    return getFinalReportCard(req, res);
});

// Get student class position
router.get('/class-position/:classId/:termId', getStudentClassPosition);

module.exports = router;