// routes/parentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getStudentResultsForTerm,
    getPublishedResultsForClass
} = require('../controllers/resultController');
const Student = require('../models/Student');

// Protect all parent routes
router.use(protect);
router.use(authorize(['parent'])); // Only parents can access these routes

// Get all results for a specific child (student) in a specific term
router.get('/results/student/:studentId/term/:termId', getStudentResultsForTerm);

// Get all published results for a specific child's class in a specific term
router.get('/results/published/student/:studentId/term/:termId', async (req, res) => {
    // Find the student's classId
    const student = await Student.findById(req.params.studentId);
    if (!student || !student.currentClass) {
        return res.status(400).json({ message: 'Student class not found' });
    }
    req.params.classId = student.currentClass.toString();
    return getPublishedResultsForClass(req, res);
});

module.exports = router;
