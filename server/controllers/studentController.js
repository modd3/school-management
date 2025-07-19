const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Parent = require('../models/Parent');
const StudentClass = require('../models/StudentClass');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Add a new student
// @route   POST /api/admin/students
// @access  Private (Admin)
exports.createStudent = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    profileData: {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      studentPhotoUrl,
      parentContactIds = [],
      classId,
      academicYear,
      electiveClassSubjectIds = [],
    },
  } = req.body;

  // 1. Create the student profile
  const student = await Student.create({
    firstName,
    lastName,
    gender,
    dateOfBirth,
    studentPhotoUrl,
    parentContactIds,
  });

  // 2. Create the linked user account
  const user = await User.create({
    email,
    password,
    role: 'student',
    roleMapping: 'Student',
    profileId: student._id,
  });

  // 3. Create StudentClass mapping
  const studentClass = await StudentClass.create({
    studentId: student._id,
    classId,
    academicYear,
    status: 'active',
    subjects: [], // Will fill below
  });

  // 4. Assign Core Subjects (utils)
  await assignCoreSubjects(student._id, classId, academicYear);

  // 5. Assign Electives (if any)
  if (electiveClassSubjectIds?.length > 0) {
    await StudentClass.findByIdAndUpdate(studentClass._id, {
      $addToSet: { subjects: { $each: electiveClassSubjectIds } },
    });
  }

  res.status(201).json({
    success: true,
    user,
    student,
    studentClass,
    message: 'Student created and assigned to class and subjects.',
  });
});

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
exports.getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.find({})
        .populate('userId', '-password')
        .populate('parentContacts');
    res.status(200).json({ success: true, count: students.length, students });
});

// @desc    Get single student by ID
// @route   GET /api/admin/students/:id
// @access  Private (Admin)
exports.getStudentById = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id)
        .populate('parentContacts', 'firstName lastName phoneNumber email')
        .populate('userId', 'email role isActive');

    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const studentClass = await StudentClass.findOne({
        student: student._id,
        status: 'Active'
    }).populate('class');

    res.status(200).json({ success: true, student, currentClass: studentClass });
});

// @desc    Update student profile
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
exports.updateStudent = asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const {
        parentContactIds, email, password, isActive,
        ...updateData
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    if (parentContactIds) {
        const newIds = parentContactIds.map(String);
        const oldIds = (student.parentContacts || []).map(p => p.toString());

        const toRemove = oldIds.filter(id => !newIds.includes(id));
        const toAdd = newIds.filter(id => !oldIds.includes(id));

        if (toRemove.length)
            await Parent.updateMany({ _id: { $in: toRemove } }, { $pull: { children: student._id } });

        if (toAdd.length) {
            for (const parentId of toAdd) {
                const parent = await Parent.findById(parentId);
                if (!parent) return res.status(404).json({ message: `Parent ${parentId} not found.` });
            }
            await Parent.updateMany({ _id: { $in: toAdd } }, { $addToSet: { children: student._id } });
        }

        student.parentContacts = newIds;
    }

    if (student.userId) {
        const user = await User.findById(student.userId);
        if (user) {
            if (email && email !== user.email) user.email = email;
            if (password) user.password = password;
            if (typeof isActive === 'boolean') user.isActive = isActive;
            await user.save({ validateBeforeSave: false });
        }
    } else if (email && password) {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already taken.' });

        const newUser = await User.create({
            email,
            password,
            role: 'student',
            roleMapping: 'Student',
            profileId: student._id
        });
        student.userId = newUser._id;
    }

    Object.assign(student, updateData);
    if (typeof isActive === 'boolean') student.isActive = isActive;

    await student.save();
    res.status(200).json({ success: true, message: 'Student profile updated', student });
});

// @desc    Delete a student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
exports.deleteStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    await StudentClass.deleteMany({ student: student._id });

    if (student.parentContacts?.length) {
        await Parent.updateMany(
            { _id: { $in: student.parentContacts } },
            { $pull: { children: student._id } }
        );
    }

    if (student.userId) {
        await User.findByIdAndDelete(student.userId);
    }

    await Student.findByIdAndDelete(student._id);

    res.status(200).json({ success: true, message: 'Student and associated data deleted.' });
});

// @desc    Reassign student to another class
// @route   PUT /api/admin/students/:id/assign-class
// @access  Private (Admin)
exports.assignStudentToClass = asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const { classId, academicYear, rollNumber } = req.body;

    if (!classId || !academicYear || !rollNumber) {
        return res.status(400).json({ message: 'classId, academicYear, and rollNumber are required.' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found.' });

    const existingClass = await Class.findById(classId);
    if (!existingClass) return res.status(404).json({ message: 'Class not found.' });

    // Deactivate existing mapping
    await StudentClass.updateMany(
        { student: studentId, status: 'Active' },
        { status: 'Transferred' }
    );

    // Create new mapping
    const newMapping = await StudentClass.create({
        student: studentId,
        class: classId,
        academicYear,
        rollNumber,
        status: 'Active',
        promotionStatus: 'Promoted'
    });

    res.status(200).json({ success: true, message: 'Student reassigned.', studentClass: newMapping });
});
