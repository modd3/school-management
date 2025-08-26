const asyncHandler = require('express-async-handler');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const StudentClass = require('../models/StudentClass');
const ClassSubject = require('../models/ClassSubject'); // Added
const Parent = require('../models/Parent'); // Added
const mongoose = require('mongoose');

// Helper function to assign core subjects (copied from authController for now)
const assignCoreSubjects = async (studentId, classId, academicYear) => {
    // Find all core subjects for the given class and academic year
    const coreClassSubjects = await ClassSubject.find({
        class: classId,
        academicYear: academicYear,
        'subject.category': 'Core', // Assuming subject is populated or you can query by category
        isActive: true
    }).lean(); 

    const coreSubjectIds = coreClassSubjects.map(cs => cs._id.toString());

    // Find the student's StudentClass entry
    const studentClassEntry = await StudentClass.findOne({
        student: studentId,
        class: classId,
        academicYear: academicYear,
    }).lean(); 

    if (studentClassEntry) {
        studentClassEntry.subjects = [...new Set([...studentClassEntry.subjects.map(String), ...coreSubjectIds])];
        // Convert back to Mongoose document for saving
        const studentClassDoc = new StudentClass(studentClassEntry); // Re-instantiate as Mongoose document
        await studentClassDoc.save();
    } else {
        console.warn(`StudentClass entry not found for student ${studentId} in class ${classId} for ${academicYear}. Core subjects not assigned.`);
    }
};


// @desc    Import students from CSV
// @route   POST /api/admin/bulk/students/import
// @access  Private (Admin)
exports.importStudents = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No CSV file uploaded.' });
    }

    const results = [];
    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename); // Assuming multer saves to 'uploads'

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            const importErrors = [];
            const importedStudents = [];

            for (const row of results) {
                try {
                    const {
                        firstName, lastName, email, password, gender, dateOfBirth,
                        classCode, academicYear, stream, parentEmails // Assuming parentEmails is comma-separated
                    } = row;

                    if (!firstName || !lastName || !email || !password || !classCode || !academicYear) {
                        importErrors.push({ row, error: 'Missing required fields.' });
                        continue;
                    }

                    // Find class
                    const studentClass = await Class.findOne({ classCode, academicYear }).lean(); // Added .lean()
                    if (!studentClass) {
                        importErrors.push({ row, error: `Class with code ${classCode} for ${academicYear} not found.` });
                        continue;
                    }

                    // Check if user already exists
                    const userExists = await User.findOne({ email }).lean(); // Added .lean()
                    if (userExists) {
                        importErrors.push({ row, error: `User with email ${email} already exists.` });
                        continue;
                    }

                    // Create User
                    const newUser = await User.create({
                        email,
                        password,
                        role: 'student',
                        firstName,
                        lastName,
                        roleMapping: 'Student',
                    });

                    // Create Student profile
                    const newStudent = await Student.create({
                        firstName,
                        lastName,
                        gender,
                        dateOfBirth,
                        currentClass: studentClass._id,
                        academicYear,
                        stream: stream || null,
                        userId: newUser._id
                    });

                    newUser.profileId = newStudent._id;
                    await newUser.save();

                    // Create StudentClass mapping
                    const lastStudentClassEntry = await StudentClass.findOne({
                        class: studentClass._id,
                        academicYear: academicYear
                    }).sort({ rollNumber: -1 }).lean(); // Added .lean()

                    const newRollNumber = (lastStudentClassEntry && lastStudentClassEntry.rollNumber) ? lastStudentClassEntry.rollNumber + 1 : 1;

                    const studentClassEntry = await StudentClass.create({
                        student: newStudent._id,
                        class: studentClass._id,
                        academicYear,
                        rollNumber: newRollNumber,
                        enrollmentDate: new Date(),
                        status: 'Active',
                        subjects: [],
                    });

                    // Assign Core Subjects
                    await assignCoreSubjects(newStudent._id, studentClass._id, academicYear);

                    // Link parents (assuming parentEmails are for existing parent users) and update their children array
                    if (parentEmails) {
                        const emailsArray = parentEmails.split(',').map(e => e.trim());
                        const parentUsers = await User.find({ email: { $in: emailsArray }, role: 'parent' }).lean(); // Added .lean()
                        const parentProfileIds = parentUsers.map(u => u.profileId);

                        if (parentProfileIds.length > 0) {
                            newStudent.parentContacts = parentProfileIds;
                            await newStudent.save();

                            await Parent.updateMany(
                                { _id: { $in: parentProfileIds } },
                                { $addToSet: { children: newStudent._id } }
                            );
                        }
                    }

                    importedStudents.push(newStudent);

                } catch (error) {
                    importErrors.push({ row, error: error.message });
                }
            }

            // Clean up the uploaded file
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });

            if (importErrors.length > 0) {
                return res.status(207).json({ // Multi-Status
                    success: false,
                    message: `Import completed with ${importedStudents.length} successes and ${importErrors.length} errors.`, 
                    importedCount: importedStudents.length,
                    errorCount: importErrors.length,
                    errors: importErrors,
                    importedStudents: importedStudents.map(s => ({ id: s._id, firstName: s.firstName, lastName: s.lastName }))
                });
            }

            res.status(200).json({
                success: true,
                message: `Successfully imported ${importedStudents.length} students.`, 
                importedCount: importedStudents.length,
                importedStudents: importedStudents.map(s => ({ id: s._id, firstName: s.firstName, lastName: s.lastName }))
            });
        });
});

// @desc    Export students to CSV
// @route   GET /api/admin/bulk/students/export
// @access  Private (Admin)
exports.exportStudents = asyncHandler(async (req, res) => {
    const students = await Student.find({}) 
        .populate('userId', 'email')
        .populate('currentClass', 'name classCode academicYear')
        .populate('parentContacts', 'firstName lastName phoneNumber')
        .lean();

    const csvRows = [];
    // CSV Header
    csvRows.push([
        'firstName', 'lastName', 'email', 'gender', 'dateOfBirth',
        'admissionNumber', 'class', 'classCode', 'academicYear', 'stream',
        'parent1FirstName', 'parent1LastName', 'parent1PhoneNumber',
        'parent2FirstName', 'parent2LastName', 'parent2PhoneNumber'
    ].join(','));

    students.forEach(student => {
        const row = [
            student.firstName,
            student.lastName,
            student.userId ? student.userId.email : '',
            student.gender,
            student.dateOfBirth ? student.dateOfBirth.toISOString().split('T')[0] : '',
            student.admissionNumber,
            student.currentClass ? student.currentClass.name : '',
            student.currentClass ? student.currentClass.classCode : '',
            student.currentClass ? student.currentClass.academicYear : '',
            student.stream || '',
        ];

        // Add parent details
        for (let i = 0; i < 2; i++) { // Assuming max 2 parents for simplicity
            if (student.parentContacts && student.parentContacts[i]) {
                row.push(student.parentContacts[i].firstName || '');
                row.push(student.parentContacts[i].lastName || '');
                row.push(student.parentContacts[i].phoneNumber || '');
            } else {
                row.push('', '', ''); // Empty fields if no parent
            }
        }
        csvRows.push(row.join(','));
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('students.csv');
    res.send(csvRows.join('\n'));
});