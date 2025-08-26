// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize, hasPermission } = require('../middleware/authMiddleware');

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
    createSubject, getAllSubjects, getSubjectById, updateSubject,  deleteSubject
} = require('../controllers/subjectController');

// Academic Calendar Management
const {
    createAcademicCalendar, getAllAcademicCalendars, getAcademicCalendarByYear,
    updateAcademicCalendar, deleteAcademicCalendar, setActiveAcademicCalendar,
    getActiveAcademicCalendar
} = require('../controllers/academicCalendarController');

// Report Card / Publishing
const { publishTermResults } = require('../controllers/reportCardController'); // Your existing import

const {
  assignSubjectToTeacher,
  getSubjectsByTeacher,
  getSubjectsByClass,
  updateAssignment,
  deleteAssignment,
  enrollStudentInSubject,
  getStudentsInSubject,
} = require('../controllers/classSubjectController');
// Class-Subject Management (Assignments)

const {getClassExamResults, getClassFinalReports} = require('../controllers/resultController');

// Progress Tracking
const {
    getStudentProgressReport,
    getClassProgressSummary,
    generateProgressReports
} = require('../controllers/progressController');

// Attendance Management
const {
    markAttendance,
    getStudentAttendanceHistory,
    getClassAttendanceSummary
} = require('../controllers/attendanceController');

// Timetable Management
const {
    createOrUpdateTimetable,
    getClassTimetable,
    getTeacherTimetable
} = require('../controllers/timetableController');

// Bulk Data Management
const {
    importStudents,
    exportStudents
} = require('../controllers/bulkDataController');

// --- Apply Middleware ---
router.use(protect);
router.use(authorize(['admin'])); // Only admins can access these routes


// --- Define Admin Routes ---

// 1. User Account Management (Admin's perspective on login accounts)
router.post('/users/register', hasPermission('administrative', 'canManageUsers'), register); // Admin creates new user accounts
router.get('/users', hasPermission('administrative', 'canManageUsers'), getAllUsers);             // Get all User accounts
router.get('/users/:id', hasPermission('administrative', 'canManageUsers'), getUserById);         // Get a single User account
router.put('/users/:id', hasPermission('administrative', 'canManageUsers'), updateUser);          // Update basic User account details (email, password, isActive)
router.put('/users/:id/role', hasPermission('administrative', 'canManageUsers'), updateUserRole); // Update only the user's role and roleMapping
router.delete('/users/:id', hasPermission('administrative', 'canManageUsers'), deleteUser);       // Deactivate User account (soft delete)

// 2. Student Management (CRUD & Assignments)
router.post('/students', hasPermission('administrative', 'canManageUsers'), createStudent);
router.get('/students', hasPermission('administrative', 'canManageUsers'), getAllStudents);
router.get('/students/:id', hasPermission('administrative', 'canManageUsers'), getStudentById);
router.put('/students/:id', hasPermission('administrative', 'canManageUsers'), updateStudent);
router.delete('/students/:id', hasPermission('administrative', 'canManageUsers'), deleteStudent); // Deactivates student profile and associated user
router.put('/students/:studentId/assign-class', hasPermission('administrative', 'canManageClasses'), assignStudentToClass); // Assign student to a specific class

// 3. Teacher Management (CRUD & Assignments)
router.post('/teachers', hasPermission('administrative', 'canManageUsers'), createTeacher);
router.get('/teachers', hasPermission('administrative', 'canManageUsers'), getAllTeachers);
router.get('/teachers/:id', hasPermission('administrative', 'canManageUsers'), getTeacherById);
router.put('/teachers/:id', hasPermission('administrative', 'canManageUsers'), updateTeacher);
router.delete('/teachers/:id', hasPermission('administrative', 'canManageUsers'), deleteTeacher); // Deactivates teacher profile and associated user
router.put('/teachers/:teacherId/assign-subject', hasPermission('administrative', 'canManageSubjects'), assignTeacherToSubject); // Assign teacher to a subject
router.put('/teachers/:teacherId/assign-class', hasPermission('administrative', 'canManageClasses'), assignTeacherToClass);     // Assign teacher as a class teacher

// 4. Parent Management (CRUD)
router.post('/parents', hasPermission('administrative', 'canManageUsers'), createParent);
router.get('/parents', hasPermission('administrative', 'canManageUsers'), getAllParents);
router.get('/parents/:id', hasPermission('administrative', 'canManageUsers'), getParentById);
router.put('/parents/:id', hasPermission('administrative', 'canManageUsers'), updateParent);
router.delete('/parents/:id', hasPermission('administrative', 'canManageUsers'), deleteParent); // Deactivates parent profile and associated user

// 5. Class Management (CRUD & Assignments)
router.post('/classes', hasPermission('administrative', 'canManageClasses'), createClass);
router.get('/classes', hasPermission('administrative', 'canManageClasses'), getAllClasses);
router.get('/classes/:id', hasPermission('administrative', 'canManageClasses'), getClassById);
router.put('/classes/:id', hasPermission('administrative', 'canManageClasses'), updateClass);
router.delete('/classes/:id', hasPermission('administrative', 'canManageClasses'), deleteClass); // Deactivates class
router.put('/classes/:classId/assign-teacher', hasPermission('administrative', 'canManageClasses'), assignClassTeacher); // Assign a class teacher to a class

// 6. Subject Management (CRUD)
router.post('/subjects', hasPermission('administrative', 'canManageSubjects'), createSubject);
router.get('/subjects', hasPermission('administrative', 'canManageSubjects'), getAllSubjects);
router.get('/subjects/:id', hasPermission('administrative', 'canManageSubjects'), getSubjectById);
router.put('/subjects/:id', hasPermission('administrative', 'canManageSubjects'), updateSubject);
router.delete('/subjects/:id', hasPermission('administrative', 'canManageSubjects'), deleteSubject); // Deactivates subject

// 7. Academic Calendar Management
router.post('/academic/calendar', hasPermission('administrative', 'canManageCalendar'), createAcademicCalendar);
router.get('/academic/calendar', hasPermission('administrative', 'canManageCalendar'), getAllAcademicCalendars);
router.get('/academic/calendar/active', hasPermission('administrative', 'canManageCalendar'), getActiveAcademicCalendar);
router.get('/academic/calendar/:academicYear', hasPermission('administrative', 'canManageCalendar'), getAcademicCalendarByYear);
router.put('/academic/calendar/:academicYear', hasPermission('administrative', 'canManageCalendar'), updateAcademicCalendar);
router.put('/academic/calendar/:academicYear/set-active', hasPermission('administrative', 'canManageCalendar'), setActiveAcademicCalendar);
router.delete('/academic/calendar/:academicYear', hasPermission('administrative', 'canManageCalendar'), deleteAcademicCalendar);

// 8. Report Card / Publishing 
router.post('/reports/publish-term-results/:academicYear/:termNumber', hasPermission('academic', 'canPublishResults'), publishTermResults);

// 9. Class-Subject Assignments (map subject to teacher in a class)
router.post('/class-subjects', hasPermission('administrative', 'canManageClasses'), assignSubjectToTeacher);
router.put('/class-subjects/:id', hasPermission('administrative', 'canManageClasses'), updateAssignment);
router.delete('/class-subjects/:id', hasPermission('administrative', 'canManageClasses'), deleteAssignment);
router.get('/class-subjects/teacher/:teacherId', hasPermission('administrative', 'canManageSubjects'), getSubjectsByTeacher);
router.get('/class-subjects/class/:classId', hasPermission('administrative', 'canManageClasses'), getSubjectsByClass);
router.post('/class-subjects/enroll', hasPermission('administrative', 'canManageClasses'), enrollStudentInSubject);
router.get('/class-subjects/:classSubjectId/students', hasPermission('administrative', 'canManageClasses'), getStudentsInSubject);

// 10. Results Management (Teacher's perspective)
// Note: These routes are primarily for teachers, but admins can also access them
// (e.g., to view results entered by teachers or manage results)

router.get('/class-results/:classId/:academicYear/:termNumber/:examType',
  hasPermission('academic', 'canViewAllResults'),
  getClassExamResults
);

router.get('/class-final-reports/:classId/:academicYear/:termNumber', 
  hasPermission('academic', 'canViewAllResults'),
  getClassFinalReports
);

// 11. Progress Tracking
router.get('/progress/student/:studentId/:academicYear', hasPermission('administrative', 'canViewReports'), getStudentProgressReport);
router.get('/progress/class/:classId/:academicYear', hasPermission('administrative', 'canViewReports'), getClassProgressSummary);
router.post('/progress/generate', hasPermission('administrative', 'canExportData'), generateProgressReports);

// 12. Attendance Management
router.post('/attendance/mark', hasPermission('administrative', 'canManageClasses'), markAttendance);
router.get('/attendance/student/:studentId/:academicYear', hasPermission('administrative', 'canViewReports'), getStudentAttendanceHistory);
router.get('/attendance/class/:classId/:academicYear', hasPermission('administrative', 'canViewReports'), getClassAttendanceSummary);

// 13. Timetable Management
router.post('/timetable', hasPermission('administrative', 'canManageClasses'), createOrUpdateTimetable);
router.get('/timetable/class/:classId/:academicYear/:termNumber', hasPermission('administrative', 'canViewReports'), getClassTimetable);
router.get('/timetable/teacher/:teacherId/:academicYear/:termNumber', hasPermission('administrative', 'canViewReports'), getTeacherTimetable);

router.post('/bulk/students/import', hasPermission('administrative', 'canManageUsers'), importStudents);
router.get('/bulk/students/export', hasPermission('administrative', 'canExportData'), exportStudents);


module.exports = router;