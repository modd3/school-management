// utils/assignElectiveSubjects.js
const StudentClass = require('../models/StudentClass');
const ClassSubject = require('../models/ClassSubject');
const Subject = require('../models/Subject');

/**
 * Assigns one elective per group to the student for the specified class and academic year.
 */
async function assignElectiveSubjects(studentId, classId, academicYear) {
  // Fetch all active class subjects for the class/year
  const classSubjects = await ClassSubject.find({
    class: classId,
    academicYear,
    isActive: true
  }).populate('subject');

  // Group elective subjects by subject.group
  const electivesByGroup = {};

  classSubjects.forEach(cs => {
    const subj = cs.subject;
    if (subj.category === 'Elective' && subj.group) {
      if (!electivesByGroup[subj.group]) {
        electivesByGroup[subj.group] = [];
      }
      electivesByGroup[subj.group].push(cs);
    }
  });

  // For now, just auto-select the first subject in each group (can be customized)
  const selectedElectiveIds = Object.values(electivesByGroup).map(
    groupList => groupList[0]?._id // ← Replace with student selection later
  ).filter(Boolean); // remove undefined/null

  // Update the StudentClass record
  await StudentClass.findOneAndUpdate(
    { studentId, classId, academicYear },
    { $addToSet: { subjects: { $each: selectedElectiveIds } } },
    { new: true }
  );
}

module.exports = assignElectiveSubjects;
