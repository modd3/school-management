// utils/assignCoreSubjects.js
const ClassSubject = require('../models/ClassSubject');
const StudentClass = require('../models/StudentClass');
const Subject = require('../models/Subject');

async function assignCoreSubjects(studentId, classId, academicYear) {
  console.log(`📚 Assigning core subjects for student ${studentId}, class ${classId}, year ${academicYear}`);
  
  // Get all active core class subjects for this class and year (ALL TERMS)
  const allClassSubjects = await ClassSubject.find({ 
    class: classId, 
    academicYear, 
    isActive: true 
  }).populate('subject');

  // Filter for core subjects only
  const coreClassSubjects = allClassSubjects.filter(cs => 
    cs.subject && cs.subject.category === 'Core'
  );

  // Group by subject ID to ensure we get ALL terms for each subject
  const coreSubjectGroups = {};
  coreClassSubjects.forEach(cs => {
    const subjectId = cs.subject._id.toString();
    if (!coreSubjectGroups[subjectId]) {
      coreSubjectGroups[subjectId] = {
        subject: cs.subject,
        classSubjects: []
      };
    }
    coreSubjectGroups[subjectId].classSubjects.push(cs);
  });

  // Collect ALL ClassSubject IDs for all core subjects across all terms
  const allCoreClassSubjectIds = [];
  Object.values(coreSubjectGroups).forEach(group => {
    const subjectName = group.subject.name;
    const termCount = group.classSubjects.length;
    console.log(`   Found ${termCount} term(s) for core subject: ${subjectName}`);
    
    // Add all ClassSubject IDs for this subject (all terms)
    group.classSubjects.forEach(cs => {
      allCoreClassSubjectIds.push(cs._id);
    });
  });

  console.log(`   Total core ClassSubject assignments: ${allCoreClassSubjectIds.length} (across ${Object.keys(coreSubjectGroups).length} subjects)`);

  // Add to StudentClass.subjects using correct field names
  const result = await StudentClass.findOneAndUpdate(
    { student: studentId, class: classId, academicYear },
    { $addToSet: { subjects: { $each: allCoreClassSubjectIds } } },
    { new: true }
  );

  console.log(`   ✅ Core subjects assigned to student across ALL terms`);
  return { 
    coreSubjectsAssigned: Object.keys(coreSubjectGroups).length, // Number of unique subjects
    totalClassSubjects: allCoreClassSubjectIds.length, // Total ClassSubject assignments
    coreSubjectIds: allCoreClassSubjectIds 
  };
}

module.exports = assignCoreSubjects;
