// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware'); // Your auth middleware
const {
    enterMarks,
    getMarksForEntry,
    addSubjectComment,
    updateClassTeacherComment
} = require('../controllers/resultController'); // Assuming resultController handles all teacher mark related functions

// Protect all teacher routes
router.use(protect); // Ensure user is logged in
router.use(authorize(['class_teacher', 'subject_teacher', 'principal', 'deputy_principal'])); // Authorize teacher roles

router.post('/results/enter', enterMarks);
router.get('/results/for-entry/:classId/:subjectId/:termId', getMarksForEntry);
router.put('/results/comment/:resultId', addSubjectComment);
router.put('/reportcard/class-comment/:reportCardId', authorize(['class_teacher', 'admin']), updateClassTeacherComment); // Class teacher specific permission

module.exports = router;
