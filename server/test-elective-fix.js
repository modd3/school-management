const mongoose = require('mongoose');
const { assignElectiveSubjects } = require('./utils/assignElectiveSubjects');

async function testElectiveAssignment() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/school_management');
    console.log('Connected to MongoDB');

    // Test parameters
    const studentId = '60b12345678901234567890'; // Dummy student ID for test
    const classId = '68736af6b813dbc56a19d47f'; // Form 2
    const academicYear = 2025; // Number that should be converted to string

    // These are Subject IDs that the frontend would send (Biology and Geography)
    const selectedElectiveIds = [
      '6873ea7aafa8035070577e90', // Biology Subject ID
      '6880f103fa02f1b373b51605'  // Geography Subject ID
    ];

    console.log('\n=== TESTING ELECTIVE ASSIGNMENT WITH FIXED ACADEMIC YEAR ===');
    console.log('Input parameters:');
    console.log('- Student ID:', studentId);
    console.log('- Class ID:', classId);
    console.log('- Academic Year (number):', academicYear, typeof academicYear);
    console.log('- Selected Elective IDs:', selectedElectiveIds);

    console.log('\n--- Calling assignElectiveSubjects function ---');
    
    // This should show our improved logging and the academic year fix
    const result = await assignElectiveSubjects(studentId, classId, academicYear, selectedElectiveIds);
    
    console.log('\n--- Result ---');
    console.log('Electives assigned:', result.electivesAssigned);
    console.log('Total ClassSubject assignments:', result.totalClassSubjects);
    console.log('Elective IDs assigned:', result.electiveIds);

  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testElectiveAssignment();
