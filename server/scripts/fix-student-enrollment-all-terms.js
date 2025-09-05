// Fix Student Enrollment for All Terms
// This script enrolls students in ClassSubject assignments for all terms where they're missing
// Usage: node scripts/fix-student-enrollment-all-terms.js

const mongoose = require('mongoose');
const ClassSubject = require('../models/ClassSubject');
const StudentClass = require('../models/StudentClass');
const Subject = require('../models/Subject');
const Term = require('../models/Term');
const Class = require('../models/Class');

// Connect to database
mongoose.connect('mongodb://localhost:27017/school_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixStudentEnrollment() {
  console.log('🔧 Starting student enrollment fix for all terms...');
  console.log('=' * 60);

  try {
    // Get all terms for 2025
    const terms = await Term.find({ academicYear: '2025' }).lean();
    console.log(`📅 Found ${terms.length} terms for 2025:`);
    terms.forEach(term => {
      console.log(`- ${term.name} (ID: ${term._id})`);
    });
    console.log('');

    let totalStudentsEnrolled = 0;
    let totalAssignmentsProcessed = 0;

    // Process each term
    for (const term of terms) {
      console.log(`\n🎯 Processing ${term.name}...`);
      console.log('-'.repeat(40));

      // Get all ClassSubject assignments for this term
      const termAssignments = await ClassSubject.find({
        term: term._id,
        academicYear: '2025',
        isActive: true
      }).populate('class', 'name').populate('subject', 'name').lean();

      console.log(`📚 Found ${termAssignments.length} ClassSubject assignments for ${term.name}`);

      let termStudentsEnrolled = 0;

      // Process each assignment
      for (const assignment of termAssignments) {
        console.log(`\nProcessing: ${assignment.class.name} - ${assignment.subject.name}`);

        // Find all students in this class for 2025
        const classStudents = await StudentClass.find({
          class: assignment.class._id,
          academicYear: '2025',
          status: 'Active'
        });

        console.log(`  Students in class: ${classStudents.length}`);

        let enrolledCount = 0;
        let alreadyEnrolledCount = 0;

        // Check and enroll each student
        for (const studentClass of classStudents) {
          // Check if student is already enrolled in this assignment
          const isAlreadyEnrolled = studentClass.subjects.some(subjectId => 
            subjectId.toString() === assignment._id.toString()
          );

          if (isAlreadyEnrolled) {
            alreadyEnrolledCount++;
          } else {
            // Enroll student in this assignment
            await StudentClass.findByIdAndUpdate(
              studentClass._id,
              { 
                $addToSet: { subjects: assignment._id },
                $set: { updatedAt: new Date() }
              }
            );
            enrolledCount++;
          }
        }

        console.log(`  ✅ Newly enrolled: ${enrolledCount}`);
        console.log(`  ✅ Already enrolled: ${alreadyEnrolledCount}`);

        termStudentsEnrolled += enrolledCount;
        totalAssignmentsProcessed++;
      }

      console.log(`\n📊 ${term.name} Summary:`);
      console.log(`  - Assignments processed: ${termAssignments.length}`);
      console.log(`  - Students newly enrolled: ${termStudentsEnrolled}`);
      
      totalStudentsEnrolled += termStudentsEnrolled;
    }

    console.log(`\n🎉 OVERALL SUMMARY:`);
    console.log(`  - Total assignments processed: ${totalAssignmentsProcessed}`);
    console.log(`  - Total students newly enrolled: ${totalStudentsEnrolled}`);

    // Verification - check a random class for all terms
    console.log(`\n🔍 VERIFICATION:`);
    
    const sampleClass = await Class.findOne({}).lean();
    if (sampleClass) {
      console.log(`\nChecking ${sampleClass.name} enrollment across all terms:`);
      
      for (const term of terms) {
        const termAssignments = await ClassSubject.find({
          class: sampleClass._id,
          term: term._id,
          academicYear: '2025',
          isActive: true
        }).lean();

        if (termAssignments.length > 0) {
          const sampleAssignment = termAssignments[0];
          const enrolledStudents = await StudentClass.countDocuments({
            class: sampleClass._id,
            academicYear: '2025',
            status: 'Active',
            subjects: sampleAssignment._id
          });

          console.log(`  ${term.name}: ${enrolledStudents} students enrolled in first subject`);
        }
      }
    }

    console.log(`\n💡 Students should now appear when teachers enter marks for any term!`);
    
  } catch (error) {
    console.error('❌ Error during enrollment fix:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixStudentEnrollment();
}

module.exports = fixStudentEnrollment;
