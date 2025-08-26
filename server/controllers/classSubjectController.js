// server/controllers/classSubjectController.js

// Ensure these modules are installed: npm install express-async-handler
const asyncHandler = require('express-async-handler');

// Ensure these models exist and their paths are correct
const ClassSubject = require('../models/ClassSubject');
const StudentClass = require('../models/StudentClass');
const User = require('../models/User'); // Needed for population or direct user interaction
const Class = require('../models/Class'); // Needed for population
const Subject = require('../models/Subject'); // Needed for population
// const Term = require('../models/Term'); // Removed


// @desc    Assign a subject to a teacher in a class
// @route   POST /api/class-subjects/
// @access  Admin
exports.assignSubjectToTeacher = asyncHandler(async (req, res) => {
  const { classId, subjectId, teacherId, academicYear, termNumber } = req.body;

  const exists = await ClassSubject.findOne({
    class: classId,
    subject: subjectId,
    teacher: teacherId,
    academicYear,
    termNumber,
  }).lean(); // Added .lean()

  if (exists) {
    res.status(400);
    throw new Error('Assignment already exists.');
  }

  const assignment = await ClassSubject.create({
    class: classId,
    subject: subjectId,
    teacher: teacherId,
    academicYear,
    termNumber,
  });

  res.status(201).json({ success: true, classSubject: assignment });
});

// @desc    Update a class-subject assignment
// @route   PUT /api/class-subjects/:id
// @access  Admin
exports.updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { classId, subjectId, teacherId, academicYear, termNumber } = req.body;

  const current = await ClassSubject.findById(id).lean(); // Added .lean()
  if (!current) {
    res.status(404);
    throw new Error('Assignment not found.');
  }

  const duplicate = await ClassSubject.findOne({
    _id: { $ne: id },
    class: classId,
    subject: subjectId,
    teacher: teacherId,
    academicYear,
    termNumber,
  }).lean(); // Added .lean()

  if (duplicate) {
    res.status(400);
    throw new Error('Duplicate assignment exists.');
  }

  // Convert back to Mongoose document for saving
  const currentDoc = new ClassSubject(current);
  currentDoc.class = classId || currentDoc.class;
  currentDoc.subject = subjectId || currentDoc.subject;
  currentDoc.teacher = teacherId || currentDoc.teacher;
  currentDoc.academicYear = academicYear || currentDoc.academicYear;
  currentDoc.termNumber = termNumber || currentDoc.termNumber;

  await currentDoc.save();

  res.status(200).json({ success: true, classSubject: currentDoc });
});

// @desc    Delete a class-subject assignment
// @route   DELETE /api/class-subjects/:id
// @access  Admin
exports.deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await ClassSubject.findByIdAndDelete(id).lean(); // Added .lean()
  if (!deleted) {
    res.status(404);
    throw new Error('Assignment not found.');
  }

  res.status(200).json({ success: true, message: 'Assignment deleted.' });
});

// @desc    Get all ClassSubjects assigned to the logged-in teacher
// @route   GET /api/class-subjects/me
// @access  Private (Teachers only)
exports.getMyClassSubjects = asyncHandler(async (req, res) => {
  // Check if the user is authenticated and has the 'teacher' role
  if (req.user.role !== 'teacher') { // Assuming 'teacher' role now covers both class_teacher and subject_teacher
    res.status(403);
    throw new Error('Not authorized to access teacher subjects. Only teacher role is allowed.');
  }

  const { academicYear, termNumber } = req.query; // Allow filtering by year and term

  const filter = {
    teacher: req.user._id, // CRUCIAL: Filter by the logged-in user's ID
    ...(academicYear && { academicYear }),
    ...(termNumber && { termNumber }),
  };

  const classSubjects = await ClassSubject.find(filter)
    .populate('class', 'name') // Populate 'name' field from Class model
    .populate('subject', 'name code category group') // <-- ADDED 'category' and 'group' here
    // .populate('term', 'name') // Removed
    .lean(); // Use .lean() for faster queries if you don't need Mongoose documents

  if (!classSubjects || classSubjects.length === 0) {
    // Return 200 with empty array if no subjects found, not 404
    return res.status(200).json({ success: true, count: 0, classSubjects: [], message: 'No class subjects found for this teacher.' });
  }

  res.status(200).json({
    success: true,
    count: classSubjects.length,
    classSubjects,
  });
});

// @desc    Get all assignments for a teacher (Admin can use this to see any teacher's subjects)
// @route   GET /api/class-subjects/teacher/:teacherId
// @access  Admin
exports.getSubjectsByTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const { academicYear, termNumber } = req.query;

  const filter = {
    teacher: teacherId,
    ...(academicYear && { academicYear }),
    ...(termNumber && { termNumber }),
  };

  const results = await ClassSubject.find(filter)
    .populate('class', 'name')
    .populate('subject', 'name code category group') // <-- ADDED 'category' and 'group' here
    // .populate('term', 'name') // Removed
    .lean();

  res.status(200).json({ success: true, count: results.length, classSubjects: results });
});

// @desc    Get all assignments for a class
// @route   GET /api/class-subjects/class/:classId
// @access  Admin/Teacher
exports.getSubjectsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { academicYear, termNumber } = req.query;

  const filter = {
    class: classId,
    ...(academicYear && { academicYear }),
    ...(termNumber && { termNumber }),
  };

  const results = await ClassSubject.find(filter)
    .populate('subject', 'name code category group') // <-- ADDED 'category' and 'group' here
    .populate('teacher', 'firstName lastName email')
    // .populate('term', 'name') // Removed
    .lean();

  res.status(200).json({ success: true, count: results.length, classSubjects: results });
});

// @desc    Enroll a student in a subject
// @route   POST /api/class-subjects/enroll
// @access  Admin/Teacher
exports.enrollStudentInSubject = asyncHandler(async (req, res) => {
  let { studentId, classSubjectId, academicYear } = req.body;

  if (!academicYear) {
    const now = new Date();
    academicYear = now.getFullYear().toString();
  }

  const mapping = await StudentClass.findOne({
    student: studentId,
    academicYear,
    status: 'Active',
  }).lean(); // Added .lean()

  if (!mapping) {
    res.status(404);
    throw new Error('Student not enrolled in this class for the academic year.');
  }

  if (mapping.subjects.includes(classSubjectId)) {
    res.status(400);
    throw new Error('Student already enrolled in this subject.');
  }

  // Convert back to Mongoose document for saving
  const mappingDoc = new StudentClass(mapping);
  mappingDoc.subjects.push(classSubjectId);
  await mappingDoc.save();

  res.status(200).json({ success: true, message: 'Student enrolled.', studentClass: mappingDoc });
});

// @desc    Get all students enrolled in a subject
// @route   GET /api/class-subjects/:classSubjectId/students?academicYear=2025
// @access  Admin/Teacher
exports.getStudentsInSubject = asyncHandler(async (req, res) => {
  const { classSubjectId } = req.params;
  const { academicYear } = req.query;

  const mappings = await StudentClass.find({
    academicYear,
    status: 'Active',
    subjects: classSubjectId,
  }).populate('student', 'firstName lastName admissionNumber currentClass stream').lean(); // Added .lean()

  // Further populate currentClass and stream within the student object if needed
  const students = await Promise.all(mappings.map(async (m) => {
    const student = m.student.toObject(); // Convert to plain object to modify
    if (student.currentClass) {
      const cls = await Class.findById(student.currentClass).select('name stream').lean();
      student.currentClass = cls; // Replace ID with populated object
    }
    return student;
  }));

  res.status(200).json({ success: true, count: students.length, students });
});
