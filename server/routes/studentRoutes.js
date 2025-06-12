const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getStudentResultsForTerm,
    getPublishedResultsForClass
} = require('../controllers/resultController');

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

module.exports = router;