// utils/getAvailableCoreSubjects.js
const ClassSubject = require('../models/ClassSubject');
const Subject = require('../models/Subject');

/**
 * Get available core subjects for a class/year (deduplicated by subject)
 */
async function getAvailableCoreSubjects(classId, academicYear) {
  console.log(`🔍 Getting available core subjects for class ${classId}, year ${academicYear}`);
  
  const classSubjects = await ClassSubject.find({
    class: classId,
    academicYear,
    isActive: true
  }).populate('subject').populate('term', 'name');

  // Filter core subjects and deduplicate by subject ID
  const coreClassSubjects = classSubjects.filter(cs => 
    cs.subject && cs.subject.category === 'Core'
  );
  
  // Group by subject ID to avoid duplicates across terms
  const uniqueCoreSubjects = new Map();
  const allClassSubjectIds = new Map(); // Store all ClassSubject IDs for each subject
  
  coreClassSubjects.forEach(cs => {
    const subjectId = cs.subject._id.toString();
    
    if (!uniqueCoreSubjects.has(subjectId)) {
      uniqueCoreSubjects.set(subjectId, {
        subject: cs.subject,
        terms: [cs.term],
        classSubjectIds: [cs._id] // Store all ClassSubject IDs for this subject
      });
    } else {
      // Add additional terms and ClassSubject IDs
      const existing = uniqueCoreSubjects.get(subjectId);
      existing.terms.push(cs.term);
      existing.classSubjectIds.push(cs._id);
    }
    
    // Also maintain a map of all ClassSubject IDs for enrollment
    if (!allClassSubjectIds.has(subjectId)) {
      allClassSubjectIds.set(subjectId, []);
    }
    allClassSubjectIds.get(subjectId).push(cs._id);
  });
  
  // Convert to array format
  const coreOptions = Array.from(uniqueCoreSubjects.entries()).map(([subjectId, data]) => ({
    subjectId: subjectId,
    subject: data.subject,
    terms: data.terms,
    classSubjectIds: data.classSubjectIds, // All ClassSubject IDs for this subject
    termCount: data.terms.length
  }));

  console.log(`   Found ${coreOptions.length} unique core subjects (deduplicated)`);
  
  return {
    success: true,
    allCoreSubjects: coreOptions,
    totalCoreSubjects: coreOptions.length,
    allClassSubjectIds: allClassSubjectIds // For internal use
  };
}

module.exports = getAvailableCoreSubjects;
