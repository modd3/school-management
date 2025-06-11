const Class = require('../models/Class');
const Teacher = require('../models/Teacher'); // For assigning class teachers
const Student = require('../models/Student'); // For populating students in a class
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new Class
// @route   POST /api/admin/classes
// @access  Private (Admin)
exports.createClass = asyncHandler(async (req, res) => {
    const { name, streams, classTeacher } = req.body;

    // Basic validation
    if (!name) {
        return res.status(400).json({ message: 'Class name is required.' });
    }

    // Check if a class with the same name already exists
    const existingClass = await Class.findOne({ name });
    if (existingClass) {
        return res.status(400).json({ message: 'Class with this name already exists.' });
    }

    // Validate and link classTeacher if provided
    if (classTeacher) {
        if (!mongoose.Types.ObjectId.isValid(classTeacher)) {
            return res.status(400).json({ message: 'Invalid classTeacher ID format.' });
        }
        const teacher = await Teacher.findById(classTeacher);
        if (!teacher) {
            return res.status(404).json({ message: 'Class teacher not found.' });
        }
        // Check if the teacher is already a class teacher for another class
        if (teacher.classTaught) {
            return res.status(400).json({ message: `Teacher ${teacher.firstName} ${teacher.lastName} is already assigned as a class teacher for another class.` });
        }
    }

    // Validate streams if provided
    if (streams && !Array.isArray(streams)) {
        return res.status(400).json({ message: 'Streams must be an array of strings.' });
    }

    const newClass = await Class.create({
        name,
        streams: streams || [],
        classTeacher: classTeacher || undefined // Link teacher if provided
    });

    // If a class teacher was assigned during creation, update their classTaught field
    if (classTeacher) {
        await Teacher.findByIdAndUpdate(classTeacher, { classTaught: newClass._id });
    }

    res.status(201).json({ success: true, message: 'Class created successfully', class: newClass });
});

// @desc    Get all Classes
// @route   GET /api/admin/classes
// @access  Private (Admin)
exports.getAllClasses = asyncHandler(async (req, res) => {
    const classes = await Class.find({})
                               .populate('classTeacher', 'firstName lastName staffId') // Populate class teacher info
                               .populate('students', 'firstName lastName admissionNumber'); // Populate students in the class
    res.status(200).json({ success: true, count: classes.length, classes });
});

// @desc    Get single Class by ID
// @route   GET /api/admin/classes/:id
// @access  Private (Admin)
exports.getClassById = asyncHandler(async (req, res) => {
    const classObj = await Class.findById(req.params.id)
                                .populate('classTeacher', 'firstName lastName staffId')
                                .populate('students', 'firstName lastName admissionNumber');
    if (!classObj) {
        return res.status(404).json({ message: 'Class not found.' });
    }
    res.status(200).json({ success: true, class: classObj });
});

// @desc    Update Class details
// @route   PUT /api/admin/classes/:id
// @access  Private (Admin)
exports.updateClass = asyncHandler(async (req, res) => {
    const { name, streams, classTeacher, isActive } = req.body;
    const classId = req.params.id;

    const classObj = await Class.findById(classId);
    if (!classObj) {
        return res.status(404).json({ message: 'Class not found.' });
    }

    // Check for duplicate name if it's being updated
    if (name && name !== classObj.name) {
        const existingClass = await Class.findOne({ name });
        if (existingClass && existingClass._id.toString() !== classId) {
            return res.status(400).json({ message: 'Class with this name already exists.' });
        }
    }

    // --- Handle classTeacher update ---
    if (classTeacher !== undefined) { // Check if 'classTeacher' was explicitly sent (can be null to unassign)
        if (classTeacher !== null && !mongoose.Types.ObjectId.isValid(classTeacher)) {
            return res.status(400).json({ message: 'Invalid classTeacher ID format.' });
        }

        // Unlink from old teacher (if any)
        if (classObj.classTeacher && classObj.classTeacher.toString() !== classTeacher) {
            await Teacher.findByIdAndUpdate(classObj.classTeacher, { classTaught: null });
        }

        if (classTeacher !== null) {
            const newTeacher = await Teacher.findById(classTeacher);
            if (!newTeacher) {
                return res.status(404).json({ message: 'New class teacher not found.' });
            }
            // Prevent assigning a teacher if they are already a class teacher for another class
            if (newTeacher.classTaught && newTeacher.classTaught.toString() !== classId) {
                return res.status(400).json({ message: `Teacher ${newTeacher.firstName} ${newTeacher.lastName} is already assigned as a class teacher to another class.` });
            }
            // Assign this class to the new teacher's classTaught field
            await Teacher.findByIdAndUpdate(classTeacher, { classTaught: classObj._id });
            classObj.classTeacher = classTeacher; // Update class's classTeacher
        } else { // classTeacher is null (unassign)
            classObj.classTeacher = null;
        }
    }

    // Validate and update streams if provided
    if (streams) {
        if (!Array.isArray(streams)) {
            return res.status(400).json({ message: 'Streams must be an array of strings.' });
        }
        classObj.streams = streams;
    }

    // Update basic fields
    if (name) classObj.name = name;
    if (typeof isActive === 'boolean') classObj.isActive = isActive;

    await classObj.save();

    res.status(200).json({ success: true, message: 'Class updated successfully', class: classObj });
});

// @desc    Delete (Deactivate) a Class
// @route   DELETE /api/admin/classes/:id
// @access  Private (Admin)
// This implements a soft delete by setting isActive to false.
exports.deleteClass = asyncHandler(async (req, res) => {
    const classObj = await Class.findById(req.params.id);

    if (!classObj) {
        return res.status(404).json({ message: 'Class not found.' });
    }

    // Soft delete the Class
    classObj.isActive = false; // Assuming isActive field on Class model
    await classObj.save();

    // If this class had a class teacher, unset them
    if (classObj.classTeacher) {
        await Teacher.findByIdAndUpdate(classObj.classTeacher, { classTaught: null });
    }

    // Optionally, unassign all students from this class
    // This is important for data consistency.
    if (classObj.students && classObj.students.length > 0) {
        await Student.updateMany(
            { _id: { $in: classObj.students } },
            { currentClass: null, stream: null } // Unset class and stream for these students
        );
    }
    classObj.students = []; // Clear students array on the class itself
    await classObj.save(); // Save again to reflect cleared students array

    res.status(200).json({ success: true, message: 'Class deactivated and linked entities unassigned successfully.' });
});

// @desc    Assign a Class Teacher to a Class
// @route   PUT /api/admin/classes/:classId/assign-teacher
// @access  Private (Admin)
exports.assignClassTeacher = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { teacherId, remove } = req.body; // Expect teacherId, remove: true to unassign

    if (!teacherId && !remove) { // If assigning, teacherId is required
        return res.status(400).json({ message: 'Please provide a teacherId to assign or unassign.' });
    }
    if (teacherId && !mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({ message: 'Invalid teacherId format.' });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
        return res.status(404).json({ message: 'Class not found.' });
    }

    let teacher = null;
    if (teacherId) {
        teacher = await Teacher.findById(teacherId);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found.' });
        }
    }

    let message;
    if (remove) {
        // If the current class teacher is the one being removed
        if (classObj.classTeacher && classObj.classTeacher.toString() === teacherId) {
            classObj.classTeacher = null;
            await classObj.save();

            // Unset this class from the teacher's classTaught field
            if (teacher) { // Teacher might be null if only removing by ID
                await Teacher.findByIdAndUpdate(teacherId, { classTaught: null });
            }
            message = `Class teacher removed from ${classObj.name}.`;
        } else {
            return res.status(400).json({ message: `Teacher ${teacher ? teacher.lastName : teacherId} is not the current class teacher for ${classObj.name}.` });
        }
    } else { // Assigning
        // Check if class already has a teacher (and it's not the same teacher being reassigned)
        if (classObj.classTeacher && classObj.classTeacher.toString() !== teacherId) {
            return res.status(400).json({ message: `Class ${classObj.name} already has a class teacher. Please unassign them first.` });
        }
        // Check if teacher is already a class teacher for another class
        if (teacher.classTaught && teacher.classTaught.toString() !== classId) {
            return res.status(400).json({ message: `Teacher ${teacher.firstName} ${teacher.lastName} is already assigned as a class teacher to another class. Please unassign them first.` });
        }

        classObj.classTeacher = teacherId;
        await classObj.save();

        teacher.classTaught = classId;
        await teacher.save();
        message = `Teacher ${teacher.firstName} ${teacher.lastName} assigned as class teacher for ${classObj.name}.`;
    }

    res.status(200).json({ success: true, message, class: classObj });
});