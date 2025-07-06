// utils/examResults.js
const Result = require('../models/Result');

async function getStudentResultsByExamType(studentId, termId, examType) {
  return Result.find({
    student: studentId,
    term: termId,
    examType
  })
  .populate('subject', 'name')
  .lean();
}

module.exports = { getStudentResultsByExamType };
