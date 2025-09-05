// Cleanup Students and Related Data
// This script removes all students, student classes, results, and related data
// Usage: node scripts/cleanup-students.js

const mongoose = require('mongoose');
const Student = require('../models/Student');
const StudentClass = require('../models/StudentClass');
const Result = require('../models/Result');
const User = require('../models/User');
const Parent = require('../models/Parent');

// Connect to database
mongoose.connect('mongodb://localhost:27017/school_management');

async function cleanupStudents() {
  console.log('🧹 Starting student data cleanup...');
  console.log('=' * 50);

  try {
    // Get counts before deletion
    const studentCount = await Student.countDocuments();
    const studentClassCount = await StudentClass.countDocuments();
    const resultCount = await Result.countDocuments();
    const studentUserCount = await User.countDocuments({ role: 'student' });

    console.log(`📊 Current data counts:`);
    console.log(`  - Students: ${studentCount}`);
    console.log(`  - StudentClass records: ${studentClassCount}`);
    console.log(`  - Results: ${resultCount}`);
    console.log(`  - Student users: ${studentUserCount}`);
    console.log('');

    if (studentCount === 0) {
      console.log('✅ No students found. Database is already clean.');
      return;
    }

    // Confirm deletion
    console.log('⚠️  This will permanently delete all student data!');
    console.log('   - All student profiles');
    console.log('   - All student user accounts');
    console.log('   - All class enrollments');
    console.log('   - All student results/marks');
    console.log('   - Parent-student relationships');
    console.log('');

    // In a real scenario, you'd want user confirmation here
    // For automation, we'll proceed
    
    console.log('🗑️  Proceeding with cleanup...');
    console.log('');

    // 1. Delete all results first (to avoid foreign key issues)
    console.log('1️⃣ Deleting all student results...');
    const deletedResults = await Result.deleteMany({});
    console.log(`   ✅ Deleted ${deletedResults.deletedCount} results`);

    // 2. Delete all StudentClass records
    console.log('2️⃣ Deleting all student class enrollments...');
    const deletedStudentClasses = await StudentClass.deleteMany({});
    console.log(`   ✅ Deleted ${deletedStudentClasses.deletedCount} student class records`);

    // 3. Get all student IDs before deletion for parent cleanup
    const studentIds = await Student.find({}, { _id: 1 });
    const studentIdList = studentIds.map(s => s._id);

    // 4. Remove student references from parents
    if (studentIdList.length > 0) {
      console.log('3️⃣ Cleaning up parent-student relationships...');
      const parentUpdate = await Parent.updateMany(
        { children: { $in: studentIdList } },
        { $pullAll: { children: studentIdList } }
      );
      console.log(`   ✅ Updated ${parentUpdate.modifiedCount} parent records`);
    }

    // 5. Delete student user accounts
    console.log('4️⃣ Deleting student user accounts...');
    const deletedUsers = await User.deleteMany({ role: 'student' });
    console.log(`   ✅ Deleted ${deletedUsers.deletedCount} student user accounts`);

    // 6. Delete all students
    console.log('5️⃣ Deleting all student profiles...');
    const deletedStudents = await Student.deleteMany({});
    console.log(`   ✅ Deleted ${deletedStudents.deletedCount} student profiles`);

    console.log('');
    console.log('🎉 Student cleanup completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  - Students deleted: ${deletedStudents.deletedCount}`);
    console.log(`  - User accounts deleted: ${deletedUsers.deletedCount}`);
    console.log(`  - Class enrollments deleted: ${deletedStudentClasses.deletedCount}`);
    console.log(`  - Results deleted: ${deletedResults.deletedCount}`);
    console.log(`  - Parents updated: ${parentUpdate?.modifiedCount || 0}`);
    console.log('');
    console.log('💡 You can now create new students with proper subject enrollment!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupStudents();
}

module.exports = cleanupStudents;
