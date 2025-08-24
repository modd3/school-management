// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// --- Import Admin Controllers ---
const { register } = require('../controllers/authController');
const { getAllUsers, getUserById, updateUser, deleteUser, updateUserRole } = require('../controllers/userManagementController');
const { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent, assignStudentToClass } = require('../controllers/studentController');
const { createTeacher, getAllTeachers, getTeacherById, updateTeacher, deleteTeacher, assignTeacherToSubject, assignTeacherToClass } = require('../controllers/teacherController');
const { createParent, getAllParents, getParentById, updateParent, deleteParent } = require('../controllers/parentController');
const { createClass, getAllClasses, getClassById, updateClass, deleteClass, assignClassTeacher } = require('../controllers/classController');
const { createSubject, getAllSubjects, getSubjectById, updateSubject,  deleteSubject } = require('../controllers/subjectController');
const { publishTermResults } = require('../controllers/reportCardController');
const { assignSubjectToTeacher, getSubjectsByTeacher, getSubjectsByClass, updateAssignment, deleteAssignment, enrollStudentInSubject, getStudentsInSubject } = require('../controllers/classSubjectController');
const { getClassFinalReports, getClassTermResults } = require('../controllers/resultController');

// --- Apply Middleware ---
router.use(protect);
router.use(authorize(['admin']));

// --- Define Admin Routes ---
router.post('/users/register', register);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.post('/students', createStudent);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.put('/students/:studentId/assign-class', assignStudentToClass);

router.post('/teachers', createTeacher);
router.get('/teachers', getAllTeachers);
router.get('/teachers/:id', getTeacherById);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher);
router.put('/teachers/:teacherId/assign-subject', assignTeacherToSubject);
router.put('/teachers/:teacherId/assign-class', assignTeacherToClass);

router.post('/parents', createParent);
router.get('/parents', getAllParents);
router.get('/parents/:id', getParentById);
router.put('/parents/:id', updateParent);
router.delete('/parents/:id', deleteParent);

router.post('/classes', createClass);
router.get('/classes', getAllClasses);
router.get('/classes/:id', getClassById);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);
router.put('/classes/:classId/assign-teacher', assignClassTeacher);

router.post('/subjects', createSubject);
router.get('/subjects', getAllSubjects);
router.get('/subjects/:id', getSubjectById);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

router.post('/reports/publish-term-results', publishTermResults);

router.post('/class-subjects', assignSubjectToTeacher);
router.put('/class-subjects/:id', updateAssignment);
router.delete('./class-subjects/:id', deleteAssignment);
router.get('/class-subjects/teacher/:teacherId', getSubjectsByTeacher);
router.get('/class-subjects/class/:classId', getSubjectsByClass);
router.post('/class-subjects/enroll', enrollStudentInSubject);
router.get('/class-subjects/:classSubjectId/students', getStudentsInSubject);

router.get('/class-final-reports/:classId/:academicYear/:term', getClassFinalReports);
router.get('/class-term-results/:classId/:academicYear/:term', getClassTermResults);

module.exports = router;
