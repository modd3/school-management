// controllers/classController.js
const asyncHandler = require('express-async-handler');
const Class = require('../models/Class');
const User = require('../models/User');
const StudentClass = require('../models/StudentClass');
const mongoose = require('mongoose');

// @desc    Create a new class

exports.createClass = asyncHandler(async (req, res) => {
  const { name, grade, classCode, academicYear, stream, classTeacher } = req.body;

  // Validate required fields
  if (!name || !grade || !classCode) {
    return res.status(400).json({ message: 'Name, grade and class code are required' });
  }

  // Check uniqueness
  const existing = await Class.findOne({ classCode, academicYear });
  if (existing) {
    return res.status(409).json({ message: 'Class code already exists for this academic year' });
  }

  const newClass = new Class({
    name,
    grade,
    classCode: classCode.toUpperCase(),
    academicYear,
    stream: Array.isArray(stream) ? stream : [],
    classTeacher: classTeacher || null,
  });

  await newClass.save();

  res.status(201).json({ message: 'Class created successfully', class: newClass });
});


exports.getAllClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find()
    .populate('classTeacher', 'firstName lastName staffId')
    .lean();
  res.status(200).json({ success: true, count: classes.length, classes });
});


exports.getClassById = asyncHandler(async (req, res) => {
  const foundClass = await Class.findById(req.params.id)
    .populate('classTeacher', 'firstName lastName staffId')
    .lean();

  if (!foundClass) {
    return res.status(404).json({ message: 'Class not found' });
  }

  res.json({ success: true, class: foundClass });
});


exports.updateClass = asyncHandler(async (req, res) => {
  const { classCode, name, academicYear } = req.body;
  const classToUpdate = await Class.findById(req.params.id);

  if (!classToUpdate) {
    return res.status(404).json({ message: 'Class not found' });
  }

  if (classCode) classToUpdate.classCode = classCode;
  if (name) classToUpdate.name = name;
  if (academicYear) classToUpdate.academicYear = academicYear;

  await classToUpdate.save();
  res.json({ success: true, class: classToUpdate });
});


exports.deleteClass = asyncHandler(async (req, res) => {
  const classToDelete = await Class.findById(req.params.id);

  if (!classToDelete) {
    return res.status(404).json({ message: 'Class not found' });
  }

  await classToDelete.deleteOne();
  res.json({ success: true, message: 'Class deleted' });
});


exports.assignClassTeacher = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { teacherId } = req.body;

  // 🔒 Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({ message: 'Invalid teacher ID format' });
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ message: 'Invalid class ID format' });
  }

  // ✅ Fetch the teacher (must be a user with role "teacher")
  const teacherUser = await User.findById(teacherId);

  if (!teacherUser || teacherUser.role !== 'teacher') {
    return res.status(400).json({ message: 'Invalid teacher ID or user is not a teacher' });
  }

  // ✅ Update the class
  const updatedClass = await Class.findByIdAndUpdate(
    classId,
    { classTeacher: teacherId },
    { new: true }
  ).populate('classTeacher', 'firstName lastName email');

  if (!updatedClass) {
    return res.status(404).json({ message: 'Class not found' });
  }

  res.status(200).json({
    success: true,
    message: `Assigned ${teacherUser.firstName} ${teacherUser.lastName} as class teacher.`,
    class: updatedClass,
  });
});


exports.getStudentsInClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { academicYear } = req.query; // Get academic year from query params

  if (!classId) {
    return res.status(400).json({ message: 'Class ID is required' });
  }

  // Build query filter
  const filter = { class: classId, status: 'Active' };
  if (academicYear) {
    filter.academicYear = academicYear;
  }

  // Find student-class mappings for this class
  const studentClassMappings = await StudentClass.find(filter)
    .populate({
      path: 'student',
      select: 'firstName lastName admissionNumber gender dateOfBirth',
    });

  // Extract student data
  const students = studentClassMappings
    .map(mapping => mapping.student)
    .filter(student => student); // Filter out nulls in case of dangling references

  res.status(200).json({ success: true, count: students.length, students });
});
