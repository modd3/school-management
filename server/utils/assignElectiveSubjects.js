// utils/assignElectiveSubjects.js
const StudentClass = require('../models/StudentClass');
const ClassSubject = require('../models/ClassSubject');
const Subject = require('../models/Subject');

/**
 * Get available elective subjects for a class/year (deduplicated by subject)
 */
async function getAvailableElectives(classId, academicYear) {
  console.log(`🔍 Getting available electives for class ${classId}, year ${academicYear}`);
  
  // Ensure academicYear is a string to match database format
  const academicYearStr = academicYear.toString();
  console.log(`   Using academicYear as string: "${academicYearStr}"`);
  
  const classSubjects = await ClassSubject.find({
    class: classId,
    academicYear: academicYearStr,
    isActive: true
  }).populate('subject').populate('term', 'name');

  // Filter electives and deduplicate by subject ID
  const electiveClassSubjects = classSubjects.filter(cs => 
    cs.subject && cs.subject.category === 'Elective'
  );
  
  // Group by subject ID to avoid duplicates across terms
  const uniqueElectives = new Map();
  const allClassSubjectIds = new Map(); // Store all ClassSubject IDs for each subject
  
  electiveClassSubjects.forEach(cs => {
    const subjectId = cs.subject._id.toString();
    const group = cs.subject.group || 'Other';
    
    if (!uniqueElectives.has(subjectId)) {
      uniqueElectives.set(subjectId, {
        subject: cs.subject,
        group: group,
        terms: [cs.term],
        classSubjectIds: [cs._id] // Store all ClassSubject IDs for this subject
      });
    } else {
      // Add additional terms and ClassSubject IDs
      const existing = uniqueElectives.get(subjectId);
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
  const electiveOptions = Array.from(uniqueElectives.entries()).map(([subjectId, data]) => ({
    subjectId: subjectId,
    subject: data.subject,
    group: data.group,
    terms: data.terms,
    classSubjectIds: data.classSubjectIds, // All ClassSubject IDs for this subject
    termCount: data.terms.length
  }));

  console.log(`   Found ${electiveOptions.length} unique elective subjects (deduplicated)`);
  
  return {
    success: true,
    allElectives: electiveOptions,
    totalElectives: electiveOptions.length,
    allClassSubjectIds: allClassSubjectIds // For internal use
  };
}

/**
 * Assigns electives to the student for the specified class and academic year.
 * If specific electives are provided, assigns those across all terms.
 * Otherwise, assigns one elective from each group across all terms.
 */
async function assignElectiveSubjects(studentId, classId, academicYear, selectedElectiveIds = null) {
  console.log(`🎨 Assigning electives for student ${studentId}, class ${classId}, year ${academicYear}`);
  console.log(`   Selected elective IDs from frontend:`, selectedElectiveIds);
  
  // Ensure academicYear is a string to match database format
  const academicYearStr = academicYear.toString();
  console.log(`   Using academicYear as string: "${academicYearStr}"`);
  
  // Get all active elective class subjects for this class and year (ALL TERMS)
  const allClassSubjects = await ClassSubject.find({ 
    class: classId, 
    academicYear: academicYearStr, 
    isActive: true 
  }).populate('subject');

  // Filter for elective subjects only
  const electiveClassSubjects = allClassSubjects.filter(cs => 
    cs.subject && cs.subject.category === 'Elective'
  );
  
  console.log(`   Found ${electiveClassSubjects.length} elective ClassSubjects:`);
  electiveClassSubjects.forEach(cs => {
    console.log(`     - ClassSubject ID: ${cs._id}, Subject: ${cs.subject.name}, Group: ${cs.subject.group}`);
  });

  // Group by subject ID to ensure we get ALL terms for each subject
  const electiveSubjectGroups = {};
  electiveClassSubjects.forEach(cs => {
    const subjectId = cs.subject._id.toString();
    if (!electiveSubjectGroups[subjectId]) {
      electiveSubjectGroups[subjectId] = {
        subject: cs.subject,
        classSubjects: []
      };
    }
    electiveSubjectGroups[subjectId].classSubjects.push(cs);
  });

  let selectedSubjectIds = [];
  let electiveClassSubjectIds = [];

  // If specific electives are provided, use those
  if (selectedElectiveIds && Array.isArray(selectedElectiveIds) && selectedElectiveIds.length > 0) {
    console.log(`   Using provided electives: ${selectedElectiveIds.length} selected`);
    
    // For each selected ClassSubject ID, find the subject and get ALL terms
    selectedElectiveIds.forEach(selectedId => {
      // Convert selectedId to string for comparison (handles both ObjectId and string inputs)
      const selectedIdStr = selectedId.toString();
      console.log(`     Searching for ClassSubject ID: ${selectedIdStr}`);
      const selectedClassSubject = electiveClassSubjects.find(cs => {
        const match = cs._id.toString() === selectedIdStr;
        if (!match) {
          console.log(`       No match: ${cs._id.toString()} !== ${selectedIdStr}`);
        }
        return match;
      });
      
      if (selectedClassSubject) {
        const subjectId = selectedClassSubject.subject._id.toString();
        console.log(`       Match found! Subject: ${selectedClassSubject.subject.name}`);
        
        if (!selectedSubjectIds.includes(subjectId)) {
          selectedSubjectIds.push(subjectId);
          const subjectGroup = electiveSubjectGroups[subjectId];
          if (subjectGroup) {
            const subjectName = subjectGroup.subject.name;
            const termCount = subjectGroup.classSubjects.length;
            console.log(`   Selected ${subjectName} - ${termCount} term(s)`);
            
            // Add ALL ClassSubject IDs for this subject (all terms)
            subjectGroup.classSubjects.forEach(cs => {
              electiveClassSubjectIds.push(cs._id);
            });
          }
        }
      } else {
        console.log(`       ❌ No match found for selected ID: ${selectedId}`);
      }
    });
  } else {
    // Default behavior: auto-select one from each group (all terms)
    console.log(`   Using default elective assignment (one from each group)`);
    
    // Group by subject group
    const subjectsByGroup = {};
    Object.values(electiveSubjectGroups).forEach(group => {
      const subjectGroup = group.subject.group || 'Other';
      if (!subjectsByGroup[subjectGroup]) {
        subjectsByGroup[subjectGroup] = [];
      }
      subjectsByGroup[subjectGroup].push(group);
    });
    
    // Select first subject from each group
    Object.entries(subjectsByGroup).forEach(([groupName, subjects]) => {
      if (subjects.length > 0) {
        const selectedSubject = subjects[0];
        const subjectId = selectedSubject.subject._id.toString();
        selectedSubjectIds.push(subjectId);
        
        const subjectName = selectedSubject.subject.name;
        const termCount = selectedSubject.classSubjects.length;
        console.log(`   Auto-selected ${subjectName} from ${groupName} group - ${termCount} term(s)`);
        
        // Add ALL ClassSubject IDs for this subject (all terms)
        selectedSubject.classSubjects.forEach(cs => {
          electiveClassSubjectIds.push(cs._id);
        });
      }
    });
  }

  console.log(`   Total elective ClassSubject assignments: ${electiveClassSubjectIds.length} (across ${selectedSubjectIds.length} subjects)`);

  // Add to StudentClass.subjects
  const result = await StudentClass.findOneAndUpdate(
    { student: studentId, class: classId, academicYear },
    { $addToSet: { subjects: { $each: electiveClassSubjectIds } } },
    { new: true }
  );

  console.log(`   ✅ ${selectedSubjectIds.length} elective subjects assigned across ALL terms`);
  return { 
    electivesAssigned: selectedSubjectIds.length, // Number of unique subjects
    totalClassSubjects: electiveClassSubjectIds.length, // Total ClassSubject assignments
    electiveIds: electiveClassSubjectIds 
  };
}

module.exports = {
  assignElectiveSubjects,
  getAvailableElectives
};
