// Check problematic student enrollments
// Usage: mongo school_management check-problematic-students.js

print("🔍 Checking potentially problematic student enrollments...");
print("=" * 50);

var problematicIds = [
    ObjectId("6898769e72bc9ea5b866d3d8"),
    ObjectId("6898771b72bc9ea5b866d419"), 
    ObjectId("6898775072bc9ea5b866d45a"),
    ObjectId("689a27e9c5dffd4f675c0be8")
];

var kiswahiliClassSubjectId = ObjectId("68b98bf9ad996dd40bc814fa");
var form4ClassId = ObjectId("689851fa032ccdda56d45cbd");

print("🔎 Investigating each student ID:\n");

var studentsToRemove = [];
var validStudents = [];

problematicIds.forEach(function(studentId) {
    print("Student ID: " + studentId);
    
    // Check if student record exists
    var student = db.students.findOne({_id: studentId});
    if (student) {
        print("  ✅ Student record: " + student.firstName + " " + student.lastName);
        print("     Active: " + (student.isActive !== false));
    } else {
        print("  ❌ No student record found!");
    }
    
    // Check StudentClass enrollment
    var studentClass = db.studentclasses.findOne({student: studentId});
    if (studentClass) {
        var className = "Unknown";
        var classObj = db.classes.findOne({_id: studentClass.class});
        if (classObj) className = classObj.name;
        
        print("  ✅ Class enrollment: " + className);
        print("     Status: " + studentClass.status);
        print("     Academic Year: " + studentClass.academicYear);
        
        var isInForm4 = studentClass.class.toString() === form4ClassId.toString();
        print("     Is in Form 4: " + isInForm4);
        
        var hasKiswahili = false;
        if (studentClass.subjects && studentClass.subjects.length > 0) {
            hasKiswahili = studentClass.subjects.some(function(subjectId) {
                return subjectId.toString() === kiswahiliClassSubjectId.toString();
            });
        }
        print("     Has Kiswahili: " + hasKiswahili);
    } else {
        print("  ❌ No class enrollment found!");
    }
    
    // Check if has User account
    var user = db.users.findOne({profileId: studentId, role: "student"});
    if (user) {
        print("  ✅ User account: " + user.email + " (Active: " + user.isActive + ")");
    } else {
        print("  ❌ No user account found!");
    }
    
    // Determine if student should be removed
    var shouldRemove = false;
    var issues = [];
    
    if (!student) {
        shouldRemove = true;
        issues.push("No student record");
    }
    
    if (!studentClass) {
        shouldRemove = true;
        issues.push("No class enrollment");
    } else if (studentClass.class.toString() !== form4ClassId.toString()) {
        shouldRemove = true;
        issues.push("Not in Form 4");
    }
    
    if (!user) {
        shouldRemove = true;
        issues.push("No user account");
    }
    
    if (student && student.isActive === false) {
        shouldRemove = true;
        issues.push("Inactive student");
    }
    
    if (shouldRemove) {
        studentsToRemove.push({
            id: studentId,
            name: student ? (student.firstName + " " + student.lastName) : "Unknown",
            issues: issues
        });
        print("  🚨 RECOMMENDATION: Remove from Kiswahili");
    } else {
        validStudents.push({
            id: studentId,
            name: student.firstName + " " + student.lastName
        });
        print("  ✅ RECOMMENDATION: Keep enrollment");
    }
    
    print("  " + "-".repeat(40));
});

print("\n📊 Final Recommendations:");
print("=" * 25);

if (studentsToRemove.length > 0) {
    print("❌ Students to REMOVE from Kiswahili:");
    studentsToRemove.forEach(function(s) {
        print("  - " + s.name + " (" + s.id + ")");
        print("    Issues: " + s.issues.join(", "));
    });
    
    print("\n🔧 To remove these students from Kiswahili, run:");
    studentsToRemove.forEach(function(s) {
        print('db.studentclasses.updateOne({student: ObjectId("' + s.id + '")}, {$pull: {subjects: ObjectId("' + kiswahiliClassSubjectId + '")}});');
    });
} else {
    print("✅ All students are validly enrolled - no action needed");
}

if (validStudents.length > 0) {
    print("\n✅ Valid students (keep enrollment):");
    validStudents.forEach(function(s) {
        print("  - " + s.name + " (" + s.id + ")");
    });
}

print("\n🎯 Summary:");
print("  - Students to remove: " + studentsToRemove.length);
print("  - Valid students: " + validStudents.length);
