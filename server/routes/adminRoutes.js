// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// --- Import Admin Controllers ---

// From authController (only for admin-initiated user registration)
const { register } = require('../controllers/authController');

// User Account Management
const {
    getAllUsers, getUserById, updateUser, deleteUser, updateUserRole
} = require('../controllers/userManagementController');

// Student Management (CRUD & Assignments)
const {
    createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent,
    assignStudentToClass // For assigning students to classes
} = require('../controllers/studentController');

// Teacher Management (CRUD & Assignments)
const {
    createTeacher, getAllTeachers, getTeacherById, updateTeacher, deleteTeacher,
    assignTeacherToSubject, // For assigning teachers to subjects
    assignTeacherToClass    // For assigning teachers as class teachers
} = require('../controllers/teacherController');

// Parent Management (CRUD)
const {
    createParent, getAllParents, getParentById, updateParent, deleteParent
} = require('../controllers/parentController');

// Class Management (CRUD & Assignments)
const {
    createClass, getAllClasses, getClassById, updateClass, deleteClass,
    assignClassTeacher // For assigning class teachers to classes
} = require('../controllers/classController');

// Subject Management (CRUD)
const {
    createSubject, getAllSubjects, getSubjectById, updateSubject, updateSubjectTeachers, deleteSubject
} = require('../controllers/subjectController');

// Term Management (CRUD)
const {
    createTerm, getAllTerms, getTermById, updateTerm, deleteTerm
} = require('../controllers/termController');

// Report Card / Publishing
const { publishTermResults } = require('../controllers/reportCardController'); // Your existing import


// --- Apply Middleware ---
router.use(protect);
router.use(authorize(['admin'])); // Only admins can access these routes


// --- Define Admin Routes ---

// 1. User Account Management (Admin's perspective on login accounts)
router.post('/users/register', register); // Admin creates new user accounts
router.get('/users', getAllUsers);             // Get all User accounts
router.get('/users/:id', getUserById);         // Get a single User account
router.put('/users/:id', updateUser);          // Update basic User account details (email, password, isActive)
router.put('/users/:id/role', updateUserRole); // Update only the user's role and roleMapping
router.delete('/users/:id', deleteUser);       // Deactivate User account (soft delete)

// 2. Student Management (CRUD & Assignments)
router.post('/students', createStudent);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent); // Deactivates student profile and associated user
router.put('/students/:studentId/assign-class', assignStudentToClass); // Assign student to a specific class

// 3. Teacher Management (CRUD & Assignments)
router.post('/teachers', createTeacher);
router.get('/teachers', getAllTeachers);
router.get('/teachers/:id', getTeacherById);
router.put('/teachers/:id', updateTeacher);
router.delete('/teachers/:id', deleteTeacher); // Deactivates teacher profile and associated user
router.put('/teachers/:teacherId/assign-subject', assignTeacherToSubject); // Assign teacher to a subject
router.put('/teachers/:teacherId/assign-class', assignTeacherToClass);     // Assign teacher as a class teacher

// 4. Parent Management (CRUD)
router.post('/parents', createParent);
router.get('/parents', getAllParents);
router.get('/parents/:id', getParentById);
router.put('/parents/:id', updateParent);
router.delete('/parents/:id', deleteParent); // Deactivates parent profile and associated user

// 5. Class Management (CRUD & Assignments)
router.post('/classes', createClass);
router.get('/classes', getAllClasses);
router.get('/classes/:id', getClassById);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass); // Deactivates class
router.put('/classes/:classId/assign-teacher', assignClassTeacher); // Assign a class teacher to a class

// 6. Subject Management (CRUD)
router.post('/subjects', createSubject);
router.get('/subjects', getAllSubjects);
router.get('/subjects/:id', getSubjectById);
router.put('/subjects/:id/teachers', updateSubjectTeachers);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject); // Deactivates subject

// 7. Term Management (CRUD)
router.post('/terms', createTerm);
router.get('/terms', getAllTerms);
router.get('/terms/:id', getTermById);
router.put('/terms/:id', updateTerm);
router.delete('/terms/:id', deleteTerm); // Deactivates term

// 8. Report Card / Publishing 
router.post('/reports/publish-term-results/:termId', publishTermResults);


module.exports = router;