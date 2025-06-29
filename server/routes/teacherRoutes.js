// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    enterMarks,
    getMarksForEntry,
    addSubjectComment,
    getStudentResultsForTerm,
    getClassResultsForTerm,
    publishTermResults,
    getPublishedResultsForClass
} = require('../controllers/resultController');
const { getMySubjects } = require('../controllers/teacherController');
const { updateClassTeacherComment } = require('../controllers/reportCardController');
const { getAllStudents } = require('../controllers/studentController');
const { getAllSubjects } = require('../controllers/subjectController');
const { getAllTerms } = require('../controllers/termController');

// Protect all teacher routes
router.use(protect);
router.use(authorize(['teacher']));

// Enter marks for a student
router.post('/results/enter', enterMarks);

router.get('/my-subjects', getMySubjects);

// Get marks for entry for a class, subject, term, and exam type
router.get('/results/for-entry/:classId/:subjectId/:termId/:examType', getMarksForEntry);

// Add or update a teacher comment on a subject result
router.put('/results/comment/:resultId', addSubjectComment);

// Get all results for a student in a specific term
router.get('/results/student/:studentId/term/:termId', getStudentResultsForTerm);

// Get all results for a class in a specific term
router.get('/results/class/:classId/term/:termId', getClassResultsForTerm);

// Publish term results for a class
router.post('/results/publish/:classId/:termId', publishTermResults);

// Get all published results for a class in a specific term
router.get('/results/published/class/:classId/term/:termId', getPublishedResultsForClass);

// Update class teacher comment on report card (class_teacher, admin only)
router.put(
    '/reportcard/class-comment/:reportCardId',
    authorize(['class_teacher', 'admin']),
    updateClassTeacherComment
);

// Allow both teachers and admins to access
router.get('/students', authorize(['teacher']),getAllStudents);
router.get('/subjects', authorize(['teacher']),getAllSubjects);
router.get('/terms', authorize(['teacher']),getAllTerms);

module.exports = router;
