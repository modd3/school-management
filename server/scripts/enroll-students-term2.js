// MongoDB Script: Enroll students in Term 2 ClassSubject assignments
// Usage: mongo school_management enroll-students-term2.js

print("🔧 Enrolling students in Term 2 ClassSubject assignments...");
print("=" * 60);

var term2Id = ObjectId("684bf23e2df1befa4ceb8874"); // Term 2, 2025
var term3Id = ObjectId("68b96455da7273a0e8418bc8"); // Term 3

// Get all Term 2 ClassSubject assignments
var term2Assignments = db.classsubjects.find({
    term: term2Id,
    academicYear: "2025",
    isActive: true
}).toArray();

print("📚 Found " + term2Assignments.length + " Term 2 ClassSubject assignments");

var totalStudentsEnrolled = 0;
var assignmentsProcessed = 0;

term2Assignments.forEach(function(assignment) {
    var classInfo = db.classes.findOne({_id: assignment.class});
    var subjectInfo = db.subjects.findOne({_id: assignment.subject});
    
    print("\nProcessing: " + (classInfo ? classInfo.name : "Unknown Class") + 
          " - " + (subjectInfo ? subjectInfo.name : "Unknown Subject"));
    
    // Find all students in this class for 2025
    var classStudents = db.studentclasses.find({
        class: assignment.class,
        academicYear: "2025",
        status: "Active"
    }).toArray();
    
    print("  Students in class: " + classStudents.length);
    
    var enrolledCount = 0;
    var alreadyEnrolledCount = 0;
    
    classStudents.forEach(function(studentClass) {
        // Check if student is already enrolled in this assignment
        var isAlreadyEnrolled = studentClass.subjects.some(function(subjectId) {
            return subjectId.toString() === assignment._id.toString();
        });
        
        if (isAlreadyEnrolled) {
            alreadyEnrolledCount++;
        } else {
            // Enroll student in this assignment
            db.studentclasses.updateOne(
                { _id: studentClass._id },
                { 
                    $addToSet: { subjects: assignment._id },
                    $set: { updatedAt: new Date() }
                }
            );
            enrolledCount++;
        }
    });
    
    print("  ✅ Newly enrolled: " + enrolledCount);
    print("  ✅ Already enrolled: " + alreadyEnrolledCount);
    
    totalStudentsEnrolled += enrolledCount;
    assignmentsProcessed++;
});

print("\n📊 Enrollment Summary:");
print("  - Assignments processed: " + assignmentsProcessed);
print("  - Students newly enrolled: " + totalStudentsEnrolled);

// Verification
print("\n🔍 Verification: Checking Form 3 - Arabic enrollment...");
var testAssignment = db.classsubjects.findOne({
    class: ObjectId("68971598a9ef16dcfcfb71d1"), // Form 3
    subject: ObjectId("68b95af263eeb5c1271d3f91"), // Arabic
    term: term2Id,
    academicYear: "2025",
    isActive: true
});

if (testAssignment) {
    var verifyCount = db.studentclasses.countDocuments({
        class: ObjectId("68971598a9ef16dcfcfb71d1"),
        academicYear: "2025", 
        status: "Active",
        subjects: testAssignment._id
    });
    print("✅ Students now enrolled in Form 3 - Arabic (Term 2): " + verifyCount);
}

print("\n🎉 Term 2 student enrollment completed!");
print("💡 Students should now appear when entering marks for Term 2.");
