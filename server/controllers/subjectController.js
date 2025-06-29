const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new Subject
// @route   POST /api/admin/subjects
// @access  Private (Admin)
exports.createSubject = asyncHandler(async (req, res) => {
    const { name, code, description, assignedTeachers } = req.body;

    // Basic validation
    if (!name || !code) {
        return res.status(400).json({ message: 'Subject name and code are required.' });
    }

    // Check if a subject with the same name or code already exists
    const existingSubject = await Subject.findOne({ code: code });
    if (existingSubject) {
        return res.status(400).json({ message: 'Subject with this code already exists.' });
    }

    // Validate and link assignedTeachers if provided
    if (assignedTeachers && assignedTeachers.length > 0) {
        if (!Array.isArray(assignedTeachers)) {
            return res.status(400).json({ message: 'assignedTeachers must be an array of teacher IDs.' });
        }
        for (const teacherId of assignedTeachers) {
            if (!mongoose.Types.ObjectId.isValid(teacherId)) {
                return res.status(400).json({ message: `Invalid teacher ID format: ${teacherId}` });
            }
            const teacher = await Teacher.findById(teacherId);
            if (!teacher) {
                return res.status(404).json({ message: `Teacher with ID ${teacherId} not found.` });
            }
        }
    }

    const subject = await Subject.create({
        name,
        code,
        description,
        assignedTeachers: assignedTeachers || []
    });

    // If teachers were assigned during creation, update their subjectsTaught array
    if (assignedTeachers && assignedTeachers.length > 0) {
        await Teacher.updateMany(
            { _id: { $in: assignedTeachers } },
            { $addToSet: { subjectsTaught: subject._id } }
        );
    }

    // Optionally populate assignedTeachers for response
    await subject.populate('assignedTeachers', 'firstName lastName staffId');
    res.status(201).json({ success: true, subject });
});

// @desc    Get all Subjects
// @route   GET /api/admin/subjects
// @access  Private (Admin)
exports.getAllSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find({})
                                  .populate('assignedTeachers', 'firstName lastName staffId'); // Populate basic teacher info
    res.status(200).json({ success: true, count: subjects.length, subjects });
});

// @desc    Get single Subject by ID
// @route   GET /api/admin/subjects/:id
// @access  Private (Admin)
exports.getSubjectById = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id)
                                  .populate('assignedTeachers', 'firstName lastName staffId');
    if (!subject) {
        return res.status(404).json({ message: 'Subject not found.' });
    }
    res.status(200).json({ success: true, subject });
});

// @desc    Update Subject details
// @route   PUT /api/admin/subjects/:id
// @access  Private (Admin)
exports.updateSubject = asyncHandler(async (req, res) => {
    const { name, code, description, assignedTeachers, isActive } = req.body;
    const subjectId = req.params.id;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        return res.status(404).json({ message: 'Subject not found.' });
    }

    // Check for duplicate name/code if they are being updated
    if (name && name !== subject.name) {
        const existingSubject = await Subject.findOne({ name });
        if (existingSubject && existingSubject._id.toString() !== subjectId) {
            return res.status(400).json({ message: 'Subject with this name already exists.' });
        }
    }
    if (code && code !== subject.code) {
        const existingSubject = await Subject.findOne({ code });
        if (existingSubject && existingSubject._id.toString() !== subjectId) {
            return res.status(400).json({ message: 'Subject with this code already exists.' });
        }
    }

    // --- Handle assignedTeachers updates ---
    if (assignedTeachers) {
        if (!Array.isArray(assignedTeachers)) {
            return res.status(400).json({ message: 'assignedTeachers must be an array of teacher IDs.' });
        }

        const oldTeacherIds = subject.assignedTeachers.map(t => t.toString());
        const newTeacherIds = assignedTeachers.map(t => t.toString());

        // Teachers to remove this subject from their subjectsTaught
        const teachersToRemove = oldTeacherIds.filter(id => !newTeacherIds.includes(id));
        if (teachersToRemove.length > 0) {
            await Teacher.updateMany(
                { _id: { $in: teachersToRemove } },
                { $pull: { subjectsTaught: subject._id } }
            );
        }

        // Teachers to add this subject to their subjectsTaught
        const teachersToAdd = newTeacherIds.filter(id => !oldTeacherIds.includes(id));
        if (teachersToAdd.length > 0) {
            for (const teacherId of teachersToAdd) {
                if (!mongoose.Types.ObjectId.isValid(teacherId)) {
                    return res.status(400).json({ message: `Invalid teacher ID to add: ${teacherId}` });
                }
                const teacher = await Teacher.findById(teacherId);
                if (!teacher) {
                    return res.status(404).json({ message: `Teacher with ID ${teacherId} not found to add.` });
                }
            }
             await Teacher.updateMany(
                { _id: { $in: teachersToAdd } },
                { $addToSet: { subjectsTaught: subject._id } }
            );
        }
        subject.assignedTeachers = newTeacherIds; // Update subject's assignedTeachers array
    }

    // Update basic fields
    if (name) subject.name = name;
    if (code) subject.code = code;
    if (description) subject.description = description;
    if (typeof isActive === 'boolean') subject.isActive = isActive;

    await subject.save();

    res.status(200).json({ success: true, message: 'Subject updated successfully', subject });
});

// @desc    Delete (Deactivate) a Subject
// @route   DELETE /api/admin/subjects/:id
// @access  Private (Admin)
// This implements a soft delete by setting isActive to false.
exports.deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findByIdAndDelete(req.params.id);

    if (!subject) {
        return res.status(404).json({ message: 'Subject not found.' });
    }

    // Soft delete the Subject
   // subject.isActive = false; // Assuming isActive field on Subject model
    // await subject.save();

    // Optionally, remove this subject from all teachers' subjectsTaught arrays
    await Teacher.updateMany(
        { subjectsTaught: subject._id },
        { $pull: { subjectsTaught: subject._id } }
    );

    // You might also need to handle implications for classes that teach this subject
    // (e.g., if you have a Class.subjects array). This depends on your schema design.

    res.status(200).json({ success: true, message: 'Subject deactivated successfully.' });
});

// @desc    Update Subject Teachers
// @route   PUT /api/admin/subjects/:id/teachers
// @access  Private (Admin)
exports.updateSubjectTeachers = asyncHandler(async (req, res) => {
    const { teacherIds } = req.body;
    const subjectId = req.params.id;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        return res.status(404).json({ message: 'Subject not found.' });
    }

    // Validate teacher IDs
    if (!Array.isArray(teacherIds)) {
        return res.status(400).json({ message: 'teacherIds must be an array' });
    }

    // Get current teachers
    const oldTeacherIds = subject.assignedTeachers.map(t => t.toString());
    const newTeacherIds = teacherIds.map(t => t.toString());

    // Remove subject from old teachers
    const teachersToRemove = oldTeacherIds.filter(id => !newTeacherIds.includes(id));
    if (teachersToRemove.length > 0) {
        await Teacher.updateMany(
            { _id: { $in: teachersToRemove } },
            { $pull: { subjectsTaught: subject._id } }
        );
    }

    // Add subject to new teachers
    const teachersToAdd = newTeacherIds.filter(id => !oldTeacherIds.includes(id));
    if (teachersToAdd.length > 0) {
        await Teacher.updateMany(
            { _id: { $in: teachersToAdd } },
            { $addToSet: { subjectsTaught: subject._id } }
        );
    }

    // Update subject's teachers
    subject.assignedTeachers = teacherIds;
    await subject.save();

    // Return populated subject with more teacher fields
    const updatedSubject = await Subject.findById(subjectId)
        .populate({
            path: 'assignedTeachers',
            select: 'firstName lastName email staffId'  // Include all fields you need
        });

    res.status(200).json({
        success: true,
        message: 'Subject teachers updated successfully',
        subject: updatedSubject
    });
});