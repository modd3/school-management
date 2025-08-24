const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getStudentTermReport,
    getFinalReportCard,
} = require('../controllers/resultController');

router.use(protect);
router.use(authorize(['student']));

router.get("/report/:academicYear/:term", getStudentTermReport);
router.get("/final-report/:academicYear/:term", getFinalReportCard);

module.exports = router;
