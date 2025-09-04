// server/controllers/classSubjectController.js

// Ensure these modules are installed: npm install express-async-handler
const asyncHandler = require('express-async-handler');

// Ensure these models exist and their paths are correct
const ClassSubject = require('../models/ClassSubject');
const StudentClass = require('../models/StudentClass');
const User = require('../models/User'); // Needed for population or direct user interaction
const Class = require('../models/Class'); // Needed for population
const Subject = require('../models/Subject'); // Needed for population
const Term = require('../models/Term'); // Needed for population


// @desc    Assign a subject to a teacher in a class
// @route   POST /api/class-subjects/
// @access  Admin
exports.assignSubjectToTeacher = asyncHandler(async (req, res) => {
  const { classId, subjectId, teacherId, academicYear, term } = req.body;

  const exists = await ClassSubject.findOne({
    class: classId,
    subject: subjectId,
    teacher: teacherId,
    academicYear,
    term,
  });

  if (exists) {
    res.status(400);
    throw new Error('Assignment already exists.');
  }

  const assignment = await ClassSubject.create({
    class: classId,
    subject: subjectId,
    teacher: teacherId,
    academicYear,
    term,
  });

  res.status(201).json({ success: true, classSubject: assignment });
});

// @desc    Update a class-subject assignment
// @route   PUT /api/class-subjects/:id
// @access  Admin
exports.updateAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { classId, subjectId, teacherId, academicYear, term } = req.body;

  const current = await ClassSubject.findById(id);
  if (!current) {
    res.status(404);
    throw new Error('Assignment not found.');
  }

  // Build the update object with only provided fields
  const updateData = {
    ...(classId && { class: classId }),
    ...(subjectId && { subject: subjectId }),
    ...(teacherId && { teacher: teacherId }),
    ...(academicYear && { academicYear }),
    ...(term && { term })
  };

  // Only check for duplicates if we're actually changing the combination
  const finalClassId = classId || current.class;
  const finalSubjectId = subjectId || current.subject;
  const finalTeacherId = teacherId || current.teacher;
  const finalAcademicYear = academicYear || current.academicYear;
  const finalTerm = term || current.term;

  // Check if the final combination would create a duplicate (excluding current record)
  const duplicate = await ClassSubject.findOne({
    _id: { $ne: id },
    class: finalClassId,
    subject: finalSubjectId,
    teacher: finalTeacherId,
    academicYear: finalAcademicYear,
    term: finalTerm,
  });

  if (duplicate) {
    res.status(400);
    throw new Error('This assignment combination already exists for another record.');
  }

  // Apply the updates
  Object.assign(current, updateData);
  await current.save();

  // Populate the response for better frontend handling
  const updatedAssignment = await ClassSubject.findById(id)
    .populate('class', 'name stream')
    .populate('subject', 'name code category group')
    .populate('teacher', 'firstName lastName email')
    .populate('term', 'name academicYear');

  res.status(200).json({ 
    success: true, 
    message: 'Assignment updated successfully',
    classSubject: updatedAssignment 
  });
});

// @desc    Delete a class-subject assignment
// @route   DELETE /api/class-subjects/:id
// @access  Admin
exports.deleteAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await ClassSubject.findByIdAndDelete(id);
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

  const { academicYear, term } = req.query; // Allow filtering by year and term

  const filter = {
    teacher: req.user._id, // CRUCIAL: Filter by the logged-in user's ID
    ...(academicYear && { academicYear }),
    ...(term && { term }),
  };

  const classSubjects = await ClassSubject.find(filter)
    .populate('class', 'name') // Populate 'name' field from Class model
    .populate('subject', 'name code category group') // <-- ADDED 'category' and 'group' here
    .populate('term', 'name') // Populate 'name' from Term model
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
  const { academicYear, term } = req.query;

  const filter = {
    teacher: teacherId,
    ...(academicYear && { academicYear }),
    ...(term && { term }),
  };

  const results = await ClassSubject.find(filter)
    .populate('class', 'name')
    .populate('subject', 'name code category group') // <-- ADDED 'category' and 'group' here
    .populate('term', 'name')
    .lean();

  res.status(200).json({ success: true, count: results.length, classSubjects: results });
});

// @desc    Get all assignments for a class
// @route   GET /api/class-subjects/class/:classId
// @access  Admin/Teacher
exports.getSubjectsByClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { academicYear, term } = req.query;

  const filter = {
    class: classId,
    ...(academicYear && { academicYear }),
    ...(term && { term }),
  };

  const results = await ClassSubject.find(filter)
    .populate('subject', 'name code category group') // <-- ADDED 'category' and 'group' here
    .populate('teacher', 'firstName lastName email')
    .populate('term', 'name')
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
  });

  if (!mapping) {
    res.status(404);
    throw new Error('Student not enrolled in this class for the academic year.');
  }

  if (mapping.subjects.includes(classSubjectId)) {
    res.status(400);
    throw new Error('Student already enrolled in this subject.');
  }

  mapping.subjects.push(classSubjectId);
  await mapping.save();

  res.status(200).json({ success: true, message: 'Student enrolled.', studentClass: mapping });
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
  }).populate('student', 'firstName lastName admissionNumber currentClass stream'); // Populate student details

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

// @desc    Get all subject assignments
// @route   GET /api/class-subjects
// @access  Admin
exports.getAllAssignments = asyncHandler(async (req, res) => {
  const { academicYear, term, classId, subjectId, teacherId } = req.query;

  console.log('getAllAssignments called with query params:', req.query);

  const filter = {
    ...(academicYear && { academicYear }),
    ...(term && { term }),
    ...(classId && { class: classId }),
    ...(subjectId && { subject: subjectId }),
    ...(teacherId && { teacher: teacherId }),
  };

  console.log('Filter being applied:', filter);

  // First, let's see total count without any filters
  const totalCount = await ClassSubject.countDocuments({});
  console.log('Total ClassSubject documents in database:', totalCount);

  const assignments = await ClassSubject.find(filter)
    .populate('class', 'name stream')
    .populate('subject', 'name code category group')
    .populate('teacher', 'firstName lastName email')
    .populate('term', 'name academicYear')
    .sort({ academicYear: -1, 'class.name': 1, 'subject.name': 1 })
    .lean();

  console.log('Assignments found after filtering:', assignments.length);
  
  if (assignments.length > 0) {
    console.log('Sample assignment:', JSON.stringify(assignments[0], null, 2));
  }

  res.status(200).json({
    success: true,
    count: assignments.length,
    assignments
  });
});

// @desc    Fix missing core subjects for existing students
// @route   POST /api/admin/class-subjects/fix-missing-core
// @access  Admin
exports.fixMissingCoreSubjects = asyncHandler(async (req, res) => {
  const { classId, academicYear, termId } = req.body;
  
  if (!classId || !academicYear) {
    res.status(400);
    throw new Error('Class ID and Academic Year are required.');
  }

  console.log(`🔧 Fixing missing core subjects for class ${classId}, year ${academicYear}`);

  try {
    // 1. Find all core subjects assigned to teachers for this class/year
    const coreClassSubjects = await ClassSubject.find({
      class: classId,
      academicYear: academicYear,
      ...(termId && { term: termId }),
      isActive: true
    }).populate('subject', 'name code category');
    
    const coreSubjectAssignments = coreClassSubjects.filter(cs => 
      cs.subject && cs.subject.category === 'Core'
    );
    
    if (coreSubjectAssignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No core subjects found assigned to teachers for this class and academic year.'
      });
    }

    const coreSubjectIds = coreSubjectAssignments.map(cs => cs._id.toString());
    console.log(`📚 Found ${coreSubjectIds.length} core subjects:`, 
      coreSubjectAssignments.map(cs => cs.subject.name));

    // 2. Find all students in this class for the academic year
    const studentClassEntries = await StudentClass.find({
      class: classId,
      academicYear: academicYear,
      status: 'Active'
    }).populate('student', 'firstName lastName admissionNumber');

    if (studentClassEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active students found in this class for the academic year.'
      });
    }

    console.log(`👥 Found ${studentClassEntries.length} students in the class`);

    // 3. Update each student with missing core subjects
    let updatedStudents = 0;
    let totalSubjectsAdded = 0;

    for (const studentEntry of studentClassEntries) {
      const currentSubjects = studentEntry.subjects.map(String);
      const missingCoreSubjects = coreSubjectIds.filter(coreId => 
        !currentSubjects.includes(coreId)
      );

      if (missingCoreSubjects.length > 0) {
        // Add missing core subjects
        studentEntry.subjects = [...new Set([...studentEntry.subjects.map(String), ...missingCoreSubjects])];
        await studentEntry.save();
        
        updatedStudents++;
        totalSubjectsAdded += missingCoreSubjects.length;
        
        console.log(`✅ Updated ${studentEntry.student.firstName} ${studentEntry.student.lastName} - added ${missingCoreSubjects.length} core subjects`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updatedStudents} students with missing core subjects.`,
      details: {
        studentsUpdated: updatedStudents,
        totalSubjectsAdded: totalSubjectsAdded,
        coreSubjectsAvailable: coreSubjectAssignments.map(cs => ({
          name: cs.subject.name,
          code: cs.subject.code,
          id: cs._id
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fixing missing core subjects:', error);
    res.status(500);
    throw new Error('Failed to fix missing core subjects: ' + error.message);
  }
});
