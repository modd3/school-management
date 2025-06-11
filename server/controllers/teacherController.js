const Teacher = require('../models/Teacher');
const User = require('../models/User'); // For potential user account linking
const Class = require('../models/Class'); // For assigning as class teacher
const Subject = require('../models/Subject'); // For assigning subjects taught
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose'); // For ObjectId validation

// @desc    Create a new Teacher profile
// @route   POST /api/admin/teachers
// @access  Private (Admin)
// This function can optionally create an associated User account if email/password are provided
exports.createTeacher = asyncHandler(async (req, res) => {
    const {
        firstName, lastName, otherNames, gender, phoneNumber, staffId,
        subjectsTaught, classTaught, teacherPhotoUrl,
        email, password // For optional creation of associated User account
    } = req.body;

    // Basic validation for Teacher profile
    if (!firstName || !lastName || !gender || !phoneNumber || !staffId) {
        return res.status(400).json({ message: 'Missing required teacher fields: firstName, lastName, gender, phoneNumber, and staffId.' });
    }

    // Check if staffId is unique
    const existingTeacher = await Teacher.findOne({ staffId });
    if (existingTeacher) {
        return res.status(400).json({ message: 'Teacher with this staff ID already exists.' });
    }

    // Validation for optional User account creation
    if (email && !password) {
        return res.status(400).json({ message: 'If providing an email, a password must also be provided to create a user account.' });
    }

    // Validate and link subjectsTaught if provided
    if (subjectsTaught && subjectsTaught.length > 0) {
        if (!Array.isArray(subjectsTaught)) {
            return res.status(400).json({ message: 'subjectsTaught must be an array of subject IDs.' });
        }
        for (const subjectId of subjectsTaught) {
            if (!mongoose.Types.ObjectId.isValid(subjectId)) {
                return res.status(400).json({ message: `Invalid subject ID format: ${subjectId}` });
            }
            const subject = await Subject.findById(subjectId);
            if (!subject) {
                return res.status(404).json({ message: `Subject with ID ${subjectId} not found.` });
            }
        }
    }

    // Validate and link classTaught if provided
    if (classTaught) {
        if (!mongoose.Types.ObjectId.isValid(classTaught)) {
            return res.status(400).json({ message: 'Invalid classTaught ID format.' });
        }
        const assignedClass = await Class.findById(classTaught);
        if (!assignedClass) {
            return res.status(404).json({ message: 'Assigned Class not found.' });
        }
        // Prevent assigning a class if it already has a class teacher
        if (assignedClass.classTeacher) {
             return res.status(400).json({ message: `Class ${assignedClass.name} already has a class teacher. Please unassign first.` });
        }
    }

    let user = null;
    if (email && password) {
        // Check if a user with this email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'A user account with this email already exists.' });
        }
        // Create an associated User account
        user = await User.create({
            email,
            password,
            role: 'subject_teacher', // Default role for a teacher account (can be changed later)
            roleMapping: 'Teacher' // Links to the Teacher profile model
        });
    }

    // Create the Teacher profile
    const teacher = await Teacher.create({
        firstName,
        lastName,
        otherNames,
        gender,
        phoneNumber,
        staffId,
        email: email || undefined, // Store email on profile if provided (useful even if no user account)
        subjectsTaught: subjectsTaught || [],
        classTaught: classTaught || undefined,
        teacherPhotoUrl: teacherPhotoUrl || undefined,
        userId: user ? user._id : undefined // Link to the created User account
    });

    // If a User account was created, link its profileId to this Teacher profile
    if (user) {
        user.profileId = teacher._id;
        await user.save();
    }

    // If subjects were taught, add this teacher to those subjects' assignedTeachers array
    if (subjectsTaught && subjectsTaught.length > 0) {
        await Subject.updateMany(
            { _id: { $in: subjectsTaught } },
            { $addToSet: { assignedTeachers: teacher._id } }
        );
    }

    // If a class was assigned, link this teacher as the classTeacher for that class
    if (classTaught) {
        await Class.findByIdAndUpdate(classTaught, { classTeacher: teacher._id });
    }

    res.status(201).json({ success: true, message: 'Teacher profile created successfully', teacher });
});

// @desc    Get all Teachers
// @route   GET /api/admin/teachers
// @access  Private (Admin)
exports.getAllTeachers = asyncHandler(async (req, res) => {
    const teachers = await Teacher.find({})
                                  .populate('userId', 'email role isActive') // Populate associated user info
                                  .populate('subjectsTaught', 'name code') // Populate subjects taught
                                  .populate('classTaught', 'name'); // Populate class taught (if any)
    res.status(200).json({ success: true, count: teachers.length, teachers });
});

// @desc    Get single Teacher by ID
// @route   GET /api/admin/teachers/:id
// @access  Private (Admin)
exports.getTeacherById = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id)
                                  .populate('userId', 'email role isActive')
                                  .populate('subjectsTaught', 'name code')
                                  .populate('classTaught', 'name streams');
    if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
    }
    res.status(200).json({ success: true, teacher });
});

// @desc    Update Teacher profile
// @route   PUT /api/admin/teachers/:id
// @access  Private (Admin)
exports.updateTeacher = asyncHandler(async (req, res) => {
    const { subjectsTaught, classTaught, email, password, isActive, ...updateData } = req.body;
    const teacherId = req.params.id;

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Prevent changing staffId if it's already set or if it's being set to a duplicate
    if (updateData.staffId && updateData.staffId !== teacher.staffId) {
        const existingTeacherWithId = await Teacher.findOne({ staffId: updateData.staffId });
        if (existingTeacherWithId && existingTeacherWithId._id.toString() !== teacherId) {
            return res.status(400).json({ message: 'Another teacher already has this staff ID.' });
        }
    }

    // --- Handle subjectsTaught updates ---
    if (subjectsTaught) {
        if (!Array.isArray(subjectsTaught)) {
            return res.status(400).json({ message: 'subjectsTaught must be an array of subject IDs.' });
        }

        const oldSubjectIds = teacher.subjectsTaught.map(s => s.toString());
        const newSubjectIds = subjectsTaught.map(s => s.toString());

        // Subjects to remove this teacher from their assignedTeachers
        const subjectsToRemove = oldSubjectIds.filter(id => !newSubjectIds.includes(id));
        if (subjectsToRemove.length > 0) {
            await Subject.updateMany(
                { _id: { $in: subjectsToRemove } },
                { $pull: { assignedTeachers: teacher._id } }
            );
        }

        // Subjects to add this teacher to their assignedTeachers
        const subjectsToAdd = newSubjectIds.filter(id => !oldSubjectIds.includes(id));
        if (subjectsToAdd.length > 0) {
            for (const subjectId of subjectsToAdd) {
                if (!mongoose.Types.ObjectId.isValid(subjectId)) {
                    return res.status(400).json({ message: `Invalid subject ID to add: ${subjectId}` });
                }
                const subject = await Subject.findById(subjectId);
                if (!subject) {
                    return res.status(404).json({ message: `Subject with ID ${subjectId} not found to add.` });
                }
            }
             await Subject.updateMany(
                { _id: { $in: subjectsToAdd } },
                { $addToSet: { assignedTeachers: teacher._id } }
            );
        }
        teacher.subjectsTaught = newSubjectIds; // Update teacher's subjectsTaught array
    }

    // --- Handle classTaught update ---
    if (classTaught !== undefined) { // Check if 'classTaught' was explicitly sent (can be null to unassign)
        if (classTaught !== null && !mongoose.Types.ObjectId.isValid(classTaught)) {
            return res.status(400).json({ message: 'Invalid classTaught ID format.' });
        }

        // Unlink from old class (if any)
        if (teacher.classTaught && teacher.classTaught.toString() !== classTaught) {
            await Class.findByIdAndUpdate(teacher.classTaught, { classTeacher: null });
        }

        if (classTaught !== null) {
            const newClass = await Class.findById(classTaught);
            if (!newClass) {
                return res.status(404).json({ message: 'New class not found.' });
            }
            // Prevent assigning if new class already has a class teacher (who is not this teacher)
            if (newClass.classTeacher && newClass.classTeacher.toString() !== teacherId) {
                return res.status(400).json({ message: `Class ${newClass.name} already has a class teacher.` });
            }
            // Assign this teacher as class teacher for the new class
            await Class.findByIdAndUpdate(classTaught, { classTeacher: teacher._id });
            teacher.classTaught = classTaught; // Update teacher's classTaught
        } else { // classTaught is null (unassign)
            teacher.classTaught = null;
        }
    }

    // --- Update associated User account if email/password/isActive provided ---
    if (teacher.userId) {
        const user = await User.findById(teacher.userId);
        if (user) {
            if (email && email !== user.email) {
                user.email = email;
            }
            if (password) {
                user.password = password; // pre-save hook will hash it
            }
            if (typeof isActive === 'boolean') {
                user.isActive = isActive;
            }
            await user.save({ validateBeforeSave: false });
        }
    } else if (email && password) {
        // If no user account was linked previously, create one now and link it
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'A user account with this email already exists and cannot be linked automatically.' });
        }
        const newUser = await User.create({
            email,
            password,
            role: 'subject_teacher', // Default role for new user
            roleMapping: 'Teacher',
            profileId: teacher._id // Link the newly created user to this teacher profile
        });
        teacher.userId = newUser._id; // Link teacher profile to the new user
    }


    // Apply other direct updates to the teacher profile
    Object.assign(teacher, updateData);
    if (typeof isActive === 'boolean') teacher.isActive = isActive; // Ensure isActive from req.body is set on teacher profile

    await teacher.save();

    res.status(200).json({ success: true, message: 'Teacher profile updated successfully', teacher });
});

// @desc    Delete (Deactivate) a Teacher profile
// @route   DELETE /api/admin/teachers/:id
// @access  Private (Admin)
// This implements a soft delete by setting isActive to false.
exports.deleteTeacher = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Soft delete the Teacher profile
    teacher.isActive = false; // Assuming isActive field on Teacher model
    await teacher.save();

    // Optionally, also deactivate the associated User account
    if (teacher.userId) {
        const user = await User.findById(teacher.userId);
        if (user) {
            user.isActive = false; // Assuming isActive field on User model
            await user.save();
        }
    }

    // Remove this teacher from all subjects' assignedTeachers arrays
    if (teacher.subjectsTaught && teacher.subjectsTaught.length > 0) {
        await Subject.updateMany(
            { _id: { $in: teacher.subjectsTaught } },
            { $pull: { assignedTeachers: teacher._id } }
        );
    }

    // If this teacher was a class teacher, unset them from that class
    if (teacher.classTaught) {
        await Class.findByIdAndUpdate(teacher.classTaught, { classTeacher: null });
    }

    res.status(200).json({ success: true, message: 'Teacher profile and associated user (if any) deactivated successfully.' });
});

// @desc    Assign a teacher to a subject
// @route   PUT /api/admin/teachers/:teacherId/assign-subject
// @access  Private (Admin)
exports.assignTeacherToSubject = asyncHandler(async (req, res) => {
    const { teacherId } = req.params;
    const { subjectId, remove } = req.body; // remove: true to unassign, false/undefined to assign

    if (!subjectId) {
        return res.status(400).json({ message: 'Please provide a subjectId.' });
    }
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ message: 'Invalid subjectId format.' });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
        return res.status(404).json({ message: 'Subject not found.' });
    }

    let message;
    if (remove) {
        // Remove from teacher's subjectsTaught
        teacher.subjectsTaught.pull(subjectId);
        await teacher.save();
        // Remove from subject's assignedTeachers
        subject.assignedTeachers.pull(teacherId);
        await subject.save();
        message = `Teacher ${teacher.lastName} unassigned from subject ${subject.name}.`;
    } else {
        // Add to teacher's subjectsTaught
        teacher.subjectsTaught.addToSet(subjectId);
        await teacher.save();
        // Add to subject's assignedTeachers
        subject.assignedTeachers.addToSet(teacherId);
        await subject.save();
        message = `Teacher ${teacher.lastName} assigned to subject ${subject.name}.`;
    }

    res.status(200).json({ success: true, message, teacher });
});

// @desc    Assign a teacher as a class teacher to a class
// @route   PUT /api/admin/teachers/:teacherId/assign-class
// @access  Private (Admin)
exports.assignTeacherToClass = asyncHandler(async (req, res) => {
    const { teacherId } = req.params;
    const { classId, remove } = req.body; // Expect classId, remove: true to unassign

    if (!classId && !remove) { // If assigning, classId is required
        return res.status(400).json({ message: 'Please provide a classId to assign the teacher as class teacher.' });
    }
    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: 'Invalid classId format.' });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found.' });
    }

    let classObj = null;
    if (classId) {
        classObj = await Class.findById(classId);
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found.' });
        }
    }

    let message;
    if (remove) {
        // Check if the teacher was indeed the class teacher for the class being unassigned from
        if (teacher.classTaught && teacher.classTaught.toString() === classId) {
            const oldClassId = teacher.classTaught;
            teacher.classTaught = null;
            await teacher.save();

            // Unlink from the old class's classTeacher field
            if (oldClassId) {
                await Class.findByIdAndUpdate(oldClassId, { classTeacher: null });
            }
            message = `Teacher ${teacher.lastName} unassigned as class teacher from ${classObj ? classObj.name : 'previous class'}.`;
        } else {
            return res.status(400).json({ message: `Teacher ${teacher.lastName} is not the class teacher for class ${classObj ? classObj.name : classId}.` });
        }

    } else {
        // Prevent assigning a teacher to a class if they are already assigned to a different one
        if (teacher.classTaught && teacher.classTaught.toString() !== classId.toString()) {
            return res.status(400).json({ message: `Teacher ${teacher.lastName} is already assigned as class teacher to another class. Please unassign them first.` });
        }
        // Prevent assigning a class if it already has a class teacher (who is not this teacher)
        if (classObj.classTeacher && classObj.classTeacher.toString() !== teacherId.toString()) {
             return res.status(400).json({ message: `Class ${classObj.name} already has a class teacher. Please unassign them first.` });
        }

        teacher.classTaught = classId;
        await teacher.save();

        classObj.classTeacher = teacherId;
        await classObj.save();
        message = `Teacher ${teacher.lastName} assigned as class teacher for ${classObj.name}.`;
    }

    res.status(200).json({ success: true, message, teacher });
});