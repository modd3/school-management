// Script to clean up Makthum and any related records for fresh testing
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const StudentClass = require('../models/StudentClass');

// Connect to the correct database
mongoose.connect('mongodb://localhost:27017/school_management');

async function cleanupMakthum() {
  try {
    console.log('🧹 Cleaning up Makthum records...');
    
    // Find Makthum's student record
    const makthum = await Student.findOne({ firstName: 'Makthum' });
    if (!makthum) {
      console.log('❌ Makthum not found in students collection');
      return;
    }
    
    console.log(`📚 Found Makthum: ${makthum.firstName} ${makthum.lastName} (ID: ${makthum._id})`);
    
    // Delete StudentClass records
    const deletedStudentClasses = await StudentClass.deleteMany({ student: makthum._id });
    console.log(`🗑️  Deleted ${deletedStudentClasses.deletedCount} StudentClass record(s)`);
    
    // Delete User record (if exists)
    if (makthum.userId) {
      const deletedUser = await User.deleteOne({ _id: makthum.userId });
      console.log(`👤 Deleted ${deletedUser.deletedCount} User record`);
    }
    
    // Delete Student record
    const deletedStudent = await Student.deleteOne({ _id: makthum._id });
    console.log(`📚 Deleted ${deletedStudent.deletedCount} Student record`);
    
    console.log('✅ Cleanup completed! You can now register Makthum again with the fixed enrollment system.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.disconnect();
  }
}

cleanupMakthum();
