const express = require('express');
const router = express.Router();
const { getStudentClassInfo, getStudentClassByYear } = require('../controllers/studentClassController');

router.get('/info', getStudentClassInfo);
router.get('/by-year', getStudentClassByYear);

module.exports = router;