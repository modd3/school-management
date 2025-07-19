// utils/results.js
const Result = require('../models/Result');

/**
 * Get Opener, Midterm, and Endterm results for a specific student, subject, and term.
 * @param {ObjectId} studentId 
 * @param {ObjectId} subjectId 
 * @param {ObjectId} termId 
 * @returns {Object} { opener, midterm, endterm } — each may be null if not found
 */
async function getExamResultsByType(studentId, subjectId, termId) {
  const [opener, midterm, endterm] = await Promise.all([
    Result.findOne({ student: studentId, subject: subjectId, term: termId, examType: 'Opener' }),
    Result.findOne({ student: studentId, subject: subjectId, term: termId, examType: 'Midterm' }),
    Result.findOne({ student: studentId, subject: subjectId, term: termId, examType: 'Endterm' }),
  ]);

  return { opener, midterm, endterm };
}

module.exports = {
  getExamResultsByType
};
