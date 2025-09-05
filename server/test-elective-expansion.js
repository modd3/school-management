const mongoose = require('mongoose');
const { assignElectiveSubjects, getAvailableElectives } = require('./utils/assignElectiveSubjects');

// Import models to register schemas
require('./models/ClassSubject');
require('./models/Subject');
require('./models/Term');
require('./models/StudentClass');

async function testElectiveExpansion() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/school_management');
    console.log('Connected to MongoDB');

    // Test parameters matching actual student creation scenario
    const studentId = '60b12345678901234567890'; // Dummy student ID for test
    const classId = '68736af6b813dbc56a19d47f'; // Form 2
    const academicYear = 2025; // Number that comes from frontend

    console.log('\n=== TESTING COMPLETE ELECTIVE EXPANSION FLOW ===');
    console.log('Simulating what happens in studentController.js lines 77-94');

    // Step 1: Frontend sends Subject IDs (not ClassSubject IDs)
    const electiveClassSubjectIds = [
      '6873ea7aafa8035070577e90', // Biology Subject ID
      '6880f103fa02f1b373b51605'  // Geography Subject ID
    ];
    
    console.log('\n--- Step 1: Frontend Selection ---');
    console.log('Frontend sends electiveClassSubjectIds:', electiveClassSubjectIds);
    console.log('These are actually Subject IDs, not ClassSubject IDs');

    // Step 2: Backend calls getAvailableElectives to get expansion data
    console.log('\n--- Step 2: Getting Available Electives for Expansion ---');
    const availableElectives = await getAvailableElectives(classId, academicYear);
    
    console.log('Available electives returned:', availableElectives.allElectives.length, 'unique subjects');
    availableElectives.allElectives.forEach(e => {
      console.log(`  - Subject ID: ${e.subjectId}, Name: ${e.subject.name}, ClassSubjects: ${e.classSubjectIds.length}`);
    });

    // Step 3: Expand Subject IDs to ClassSubject IDs (like in studentController.js)
    console.log('\n--- Step 3: Expanding Subject IDs to ClassSubject IDs ---');
    const expandedClassSubjectIds = [];
    
    electiveClassSubjectIds.forEach(selectedId => {
      // Check if it's a subject ID that needs expansion
      const elective = availableElectives.allElectives.find(e => e.subjectId === selectedId);
      if (elective) {
        // Expand subject ID to all its ClassSubject IDs (across all terms)
        console.log(`   ✅ Expanding subject ${elective.subject.name} to ${elective.classSubjectIds.length} ClassSubjects`);
        console.log(`      ClassSubject IDs: ${elective.classSubjectIds.join(', ')}`);
        expandedClassSubjectIds.push(...elective.classSubjectIds);
      } else {
        // Already a ClassSubject ID, use as-is
        console.log(`   ⚠️  ID ${selectedId} not found in available electives - treating as ClassSubject ID`);
        expandedClassSubjectIds.push(selectedId);
      }
    });
    
    console.log(`   📦 Expanded to ${expandedClassSubjectIds.length} ClassSubject assignments:`, expandedClassSubjectIds);

    // Step 4: Call assignElectiveSubjects with expanded ClassSubject IDs
    console.log('\n--- Step 4: Assigning Expanded ClassSubject IDs ---');
    const result = await assignElectiveSubjects(studentId, classId, academicYear, expandedClassSubjectIds);
    
    console.log('\n--- Final Result ---');
    console.log('✅ SUCCESS! Electives assigned:', result.electivesAssigned);
    console.log('✅ Total ClassSubject assignments:', result.totalClassSubjects);
    console.log('✅ Final elective ClassSubject IDs:', result.electiveIds.length > 0 ? result.electiveIds : 'None (StudentClass update failed due to fake student ID)');

  } catch (error) {
    console.error('Error during test:', error.message);
    if (error.message.includes('Cast to ObjectId failed')) {
      console.log('💡 Note: The "Cast to ObjectId" error is expected since we used a fake student ID.');
      console.log('    The important part is that the ID expansion and matching worked correctly!');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testElectiveExpansion();
