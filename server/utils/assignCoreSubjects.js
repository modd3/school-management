// utils/assignCoreSubjects.js
const ClassSubject = require('../models/ClassSubject');
const StudentClass = require('../models/StudentClass');
const Subject = require('../models/Subject');

async function assignCoreSubjects(studentId, classId, academicYear) {
  // Get all active core class subjects
  const coreSubjects = await ClassSubject.find({ 
    class: classId, 
    academicYear, 
    isActive: true 
  }).populate('subject');

  const coreClassSubjectIds = coreSubjects
    .filter(cs => cs.subject.category === 'Core')
    .map(cs => cs._id);

  // Add to StudentClass.subjects
  await StudentClass.findOneAndUpdate(
    { studentId, classId, academicYear },
    { $addToSet: { subjects: { $each: coreClassSubjectIds } } },
    { new: true }
  );
}

module.exports = assignCoreSubjects;
