// routes/parentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getStudentReportCard } = require('../controllers/reportCardController');

router.use(protect);
router.use(authorize(['parent'])); // Only parents can access these routes

router.get('/reportcard/:studentId/:termId', getStudentReportCard); // Parent can get their child's report card

module.exports = router;
