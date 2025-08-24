const express = require('express');
const router = express.Router();
const { getAcademicCalendars } = require('../controllers/academicCalendarController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Since calendars are needed for filtering on many pages for different roles,
// we can allow all authenticated users to access this.
router.route('/')
    .get(protect, authorize(['admin', 'teacher', 'student', 'parent']), getAcademicCalendars);

module.exports = router;