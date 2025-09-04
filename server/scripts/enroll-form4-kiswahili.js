// MongoDB Script: Enroll Form 4 students in Kiswahili
// Usage: mongo school_management enroll-form4-kiswahili.js

print("🔄 Enrolling Form 4 students in Kiswahili as core subject...");
print("=" * 60);

// Get Form 4 class and Kiswahili subject
var form4Class = db.classes.findOne({name: "Form 4"});
var kiswahili = db.subjects.findOne({code: "KISW"});
var currentYear = "2025"; // Based on the sample data

if (!form4Class || !kiswahili) {
    print("❌ Required data not found!");
    quit();
}

print("📚 Class: " + form4Class.name + " (ID: " + form4Class._id + ")");
print("📖 Subject: " + kiswahili.name + " (ID: " + kiswahili._id + ")");
print("📅 Academic Year: " + currentYear);

// Step 1: Check if we need to create a ClassSubject assignment
print("\n1️⃣  Checking ClassSubject assignment...");

var existingClassSubject = db.classsubjects.findOne({
    class: form4Class._id,
    subject: kiswahili._id,
    academicYear: currentYear,
    isActive: true
});

var classSubjectId;

if (existingClassSubject) {
    print("✅ ClassSubject assignment already exists (ID: " + existingClassSubject._id + ")");
    classSubjectId = existingClassSubject._id;
} else {
    print("⚠️  No ClassSubject assignment found. Creating a basic one...");
    
    // Get a sample teacher (any teacher will do for now)
    var sampleTeacher = db.users.findOne({role: "teacher"});
    var sampleTerm = db.terms.findOne({academicYear: currentYear});
    
    if (!sampleTeacher || !sampleTerm) {
        print("❌ Cannot create ClassSubject: Need at least one teacher and one term");
        print("   Teachers found: " + db.users.countDocuments({role: "teacher"}));
        print("   Terms for " + currentYear + ": " + db.terms.countDocuments({academicYear: currentYear}));
        quit();
    }
    
    // Create new ClassSubject assignment
    var newClassSubject = {
        class: form4Class._id,
        subject: kiswahili._id,
        teacher: sampleTeacher._id,
        academicYear: currentYear,
        term: sampleTerm._id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    var insertResult = db.classsubjects.insertOne(newClassSubject);
    classSubjectId = insertResult.insertedId;
    
    print("✅ Created new ClassSubject assignment (ID: " + classSubjectId + ")");
    print("   - Teacher: " + sampleTeacher.email);
    print("   - Term: " + sampleTerm.name);
}

// Step 2: Find Form 4 students
print("\n2️⃣  Finding Form 4 students...");

var form4Students = db.studentclasses.find({
    class: form4Class._id,
    academicYear: currentYear,
    status: "Active"
}).toArray();

print("👥 Found " + form4Students.length + " Form 4 students");

// Step 3: Enroll students in Kiswahili
print("\n3️⃣  Enrolling students...");

var studentsEnrolled = 0;
var studentsAlreadyEnrolled = 0;
var errors = 0;

form4Students.forEach(function(studentClass) {
    // Get student details for display
    var student = db.students.findOne({_id: studentClass.student});
    var studentName = student ? (student.firstName + " " + student.lastName) : "ID: " + studentClass.student;
    
    try {
        // Check if student is already enrolled in this specific ClassSubject
        var isAlreadyEnrolled = false;
        if (studentClass.subjects && studentClass.subjects.length > 0) {
            isAlreadyEnrolled = studentClass.subjects.some(function(subjectId) {
                return subjectId.toString() === classSubjectId.toString();
            });
        }
        
        if (isAlreadyEnrolled) {
            print("   ✅ " + studentName + " - Already enrolled");
            studentsAlreadyEnrolled++;
        } else {
            // Enroll student in Kiswahili (add ClassSubject ID to student's subjects array)
            var result = db.studentclasses.updateOne(
                { _id: studentClass._id },
                { 
                    $addToSet: { subjects: classSubjectId },
                    $set: { updatedAt: new Date() }
                }
            );
            
            if (result.modifiedCount > 0) {
                print("   ✅ " + studentName + " - Newly enrolled");
                studentsEnrolled++;
            } else {
                print("   ⚠️  " + studentName + " - No changes made");
            }
        }
    } catch (e) {
        print("   ❌ " + studentName + " - Error: " + e.message);
        errors++;
    }
});

// Step 4: Verification
print("\n4️⃣  Verification...");

var totalEnrolledNow = db.studentclasses.countDocuments({
    class: form4Class._id,
    academicYear: currentYear,
    status: "Active",
    subjects: classSubjectId
});

print("✅ Total students now enrolled in Kiswahili: " + totalEnrolledNow);

// Summary
print("\n📊 Final Summary:");
print("=" * 30);
print("   - Students newly enrolled: " + studentsEnrolled);
print("   - Students already enrolled: " + studentsAlreadyEnrolled);
print("   - Errors encountered: " + errors);
print("   - Total Form 4 students: " + form4Students.length);
print("   - Total now enrolled in Kiswahili: " + totalEnrolledNow);

if (studentsEnrolled > 0) {
    print("\n✅ SUCCESS: " + studentsEnrolled + " students have been enrolled in Kiswahili!");
}

if (errors > 0) {
    print("\n⚠️  There were " + errors + " errors during enrollment.");
}

print("\n🎉 Enrollment process completed!");
print("📝 Note: Students can now see Kiswahili in their subject list and receive grades for it.");
