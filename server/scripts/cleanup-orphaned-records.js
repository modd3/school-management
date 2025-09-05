// MongoDB Script: Clean up orphaned StudentClass records
// Usage: mongo school_management cleanup-orphaned-records.js

print("🧹 Cleaning up orphaned StudentClass records...");
print("=" * 45);

// Find StudentClass records that reference non-existent students
var orphanedRecords = [];
var totalChecked = 0;

db.studentclasses.find({status: "Active"}).forEach(function(studentClass) {
    var student = db.students.findOne({_id: studentClass.student});
    if (!student) {
        orphanedRecords.push(studentClass._id);
        print("  Found orphaned record: " + studentClass._id + " -> Missing student: " + studentClass.student);
    }
    totalChecked++;
    
    if (totalChecked % 10 === 0) {
        print("  Checked " + totalChecked + " records...");
    }
});

print("\n📊 Results:");
print("  Total StudentClass records checked: " + totalChecked);
print("  Orphaned records found: " + orphanedRecords.length);

if (orphanedRecords.length > 0) {
    print("\n🗑️  Removing orphaned StudentClass records...");
    
    var deletedCount = 0;
    orphanedRecords.forEach(function(recordId) {
        var result = db.studentclasses.deleteOne({_id: recordId});
        if (result.deletedCount > 0) {
            deletedCount++;
        }
    });
    
    print("✅ Deleted " + deletedCount + " orphaned StudentClass records");
    print("🎯 This should resolve the null student reference errors");
} else {
    print("\n✅ No orphaned records found - database is clean!");
}

print("\n🎉 Cleanup completed!");
