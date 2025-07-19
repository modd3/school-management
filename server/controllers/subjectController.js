const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Create a new subject
exports.createSubject = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    category,
    creditHours,
    group,
    description,
    isActive = true
  } = req.body;

  // Check required
  if (!name || !code || !category || !creditHours) {
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }

  // Enforce group only for Elective subjects
  const subject = new Subject({
    name,
    code,
    category,
    creditHours,
    group: category === 'Elective' ? group : undefined,
    description,
    isActive
  });

  await subject.save();

  res.status(201).json({ success: true, subject });
});


// Get all subjects
exports.getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: subjects.length, subjects });
});

// Get a single subject
exports.getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: 'Subject not found.' });
  res.json({ success: true, subject });
});

// Update subject
exports.updateSubject = asyncHandler(async (req, res) => {
  const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Subject not found.' });
  res.json({ success: true, subject: updated });
});

// Delete (soft) subject
exports.deleteSubject = asyncHandler(async (req, res) => {
  const deleted = await Subject.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!deleted) return res.status(404).json({ message: 'Subject not found.' });
  res.json({ success: true, message: 'Subject deactivated.' });
});
