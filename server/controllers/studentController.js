const Student = require('../models/Student');
const User = require('../models/User'); // For potential user account linking (e.g., if students get a login)
const Class = require('../models/Class'); // For managing student-to-class assignments
const Parent = require('../models/Parent'); // For managing parent-student relationships
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose'); // For ObjectId validation


// @desc    Add a new student
// @route   POST /api/admin/students
// @access  Private (Admin)
exports.createStudent = asyncHandler(async (req, res) => {
    try {
        const {
            firstName, lastName, otherNames, dateOfBirth, gender,
            currentClass, parentContactIds, studentPhotoUrl,
            email, password // For optional creation of associated User account
        } = req.body;

        // Basic validation for Student profile
        if (!firstName || !lastName || !dateOfBirth || !gender) {
            return res.status(400).json({ message: 'Missing required student fields: firstName, lastName, dateOfBirth, gender.' });
        }

        // Validation for currentClass (if provided during creation)
        if (currentClass) {
            if (!mongoose.Types.ObjectId.isValid(currentClass)) {
                return res.status(400).json({ message: 'Invalid currentClass ID format.' });
            }
            const existingClass = await Class.findById(currentClass);
            if (!existingClass) {
                return res.status(404).json({ message: 'Assigned Class not found.' });
            }
        }

        // Validation for optional User account creation
        if (email && !password) {
            return res.status(400).json({ message: 'If providing an email, a password must also be provided to create a user account for the student.' });
        }

        // Validate and link parents if provided
        if (parentContactIds && parentContactIds.length > 0) {
            if (!Array.isArray(parentContactIds)) {
                return res.status(400).json({ message: 'parentContactIds must be an array of parent IDs.' });
            }
            for (const parentId of parentContactIds) {
                if (!mongoose.Types.ObjectId.isValid(parentId)) {
                    return res.status(400).json({ message: `Invalid parent ID format: ${parentId}` });
                }
                const parent = await Parent.findById(parentId);
                if (!parent) {
                    return res.status(404).json({ message: `Parent with ID ${parentId} not found.` });
                }
            }
        }


        let user = null;
        if (email && password) {
            // Check if a user with this email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'A user account with this email already exists.' });
            }
            // Create an associated User account for the student
            user = await User.create({
                email,
                password,
                role: 'student', // Default role for a student account
                roleMapping: 'Student' // Links to the Student profile model
            });
        }

        // Create student profile
        const student = await Student.create({
            firstName,
            lastName,
            otherNames,
            dateOfBirth,
            gender,
            currentClass: currentClass || undefined,
            parentContacts: parentContactIds || [],
            studentPhotoUrl: studentPhotoUrl || undefined,
            userId: user?._id    // Link to user if created
        });

        // If a User account was created, link its profileId to this Student profile
        if (user) {
            user.profileId = student._id;
            await user.save();
        }

        // If a class was provided, add student to that class's students array
        if (currentClass) {
            await Class.findByIdAndUpdate(currentClass, { $addToSet: { students: student._id } });
        }

        // If parents were provided, link this student to their children array
        if (parentContactIds && parentContactIds.length > 0) {
            await Parent.updateMany(
                { _id: { $in: parentContactIds } },
                { $addToSet: { children: student._id } }
            );
        }

        res.status(201).json({ success: true, message: 'Student created successfully', student });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                error: error.message
            });
        }
        throw error; // Let the asyncHandler catch other errors
    }
});


// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
exports.getAllStudents = asyncHandler(async (req, res) => {
    const students = await Student.find({})
                                .populate('userId', '-password') // Populate user details
                                .populate('currentClass')        // If you need class details
                                .populate('parentContacts');     // If you need parent details
    res.status(200).json({ success: true, count: students.length, students });
});

// @desc    Get single student by ID
// @route   GET /api/admin/students/:id
// @access  Private (Admin)
exports.getStudentById = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id)
                                .populate('currentClass', 'name streams')
                                .populate('parentContacts', 'firstName lastName phoneNumber email')
                               // .populate('userId', 'email role isActive');

    if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json({ success: true, student });
});

// @desc    Update student profile
// @route   PUT /api/admin/students/:id
// @access  Private (Admin)
exports.updateStudent = asyncHandler(async (req, res) => {
    const { currentClass, parentContacts, email, password, isActive, ...updateData } = req.body;
    const studentId = req.params.id;

    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
    }

    // --- Handle currentClass update ---
    if (currentClass !== undefined) { // Check if 'currentClass' was explicitly sent (can be null to unassign)
        if (currentClass !== null && !mongoose.Types.ObjectId.isValid(currentClass)) {
            return res.status(400).json({ message: 'Invalid currentClass ID format.' });
        }
        if (currentClass !== null) {
            const newClass = await Class.findById(currentClass);
            if (!newClass) {
                return res.status(404).json({ message: 'New class not found.' });
            }
            // Remove student from old class's students array if different
            if (student.currentClass && student.currentClass.toString() !== currentClass.toString()) {
                await Class.findByIdAndUpdate(student.currentClass, { $pull: { students: student._id } });
            }
            // Add student to new class's students array
            await Class.findByIdAndUpdate(currentClass, { $addToSet: { students: student._id } });
            student.currentClass = currentClass; // Update student's currentClass
        } else { // currentClass is null (unassign)
            if (student.currentClass) {
                await Class.findByIdAndUpdate(student.currentClass, { $pull: { students: student._id } });
            }
            student.currentClass = null;
        }
    }

    // --- Handle parentContactIds update ---
    if (parentContactIds) {
        if (!Array.isArray(parentContactIds)) {
            return res.status(400).json({ message: 'parentContactIds must be an array of parent IDs.' });
        }

        const oldParentIds = student.parentContacts.map(p => p.toString());
        const newParentIds = parentContactIds.map(p => p.toString());

        // Parents to remove this student from their children array
        const parentsToRemove = oldParentIds.filter(id => !newParentIds.includes(id));
        if (parentsToRemove.length > 0) {
            await Parent.updateMany(
                { _id: { $in: parentsToRemove } },
                { $pull: { children: student._id } }
            );
        }

        // Parents to add this student to their children array
        const parentsToAdd = newParentIds.filter(id => !oldParentIds.includes(id));
        if (parentsToAdd.length > 0) {
            for (const parentId of parentsToAdd) {
                if (!mongoose.Types.ObjectId.isValid(parentId)) {
                    return res.status(400).json({ message: `Invalid parent ID to add: ${parentId}` });
                }
                const parent = await Parent.findById(parentId);
                if (!parent) {
                    return res.status(404).json({ message: `Parent with ID ${parentId} not found to add.` });
                }
            }
             await Parent.updateMany(
                { _id: { $in: parentsToAdd } },
                { $addToSet: { children: student._id } }
            );
        }
        student.parentContacts = newParentIds; // Update student's parentContacts array
    }

    // --- Update associated User account if email/password/isActive provided ---
    if (student.userId) {
        const user = await User.findById(student.userId);
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
            role: 'student',
            roleMapping: 'Student',
            profileId: student._id // Link the newly created user to this student profile
        });
        student.userId = newUser._id; // Link student profile to the new user
    }

    // Apply other direct updates to the student profile
    Object.assign(student, updateData); // Copies remaining updateData fields to student
    if (typeof isActive === 'boolean') student.isActive = isActive; // Ensure isActive from req.body is set on student profile

    await student.save();

    res.status(200).json({ success: true, message: 'Student profile updated successfully', student });
});

// @desc    Delete a student (fully remove from DB)
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin)
exports.deleteStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);

    if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
    }

    // Remove student from their current class's students array
    if (student.currentClass) {
        await Class.findByIdAndUpdate(student.currentClass, { $pull: { students: student._id } });
    }

    // Remove this student from all parents' children arrays
    if (student.parentContacts && student.parentContacts.length > 0) {
        await Parent.updateMany(
            { _id: { $in: student.parentContacts } },
            { $pull: { children: student._id } }
        );
    }

    // Optionally, also delete the associated User account
    if (student.userId) {
        await User.findByIdAndDelete(student.userId);
    }

    // Finally, delete the student document
    await Student.findByIdAndDelete(student._id);

    res.status(200).json({ success: true, message: 'Student and associated user (if any) deleted successfully.' });
});

// @desc    Assign a student to a class
// @route   PUT /api/admin/students/:studentId/assign-class
// @access  Private (Admin)
exports.assignStudentToClass = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { classId, stream } = req.body; // Expect classId and optional stream

    if (!classId && classId !== null) { // Allow classId to be null for unassignment
        return res.status(400).json({ message: 'Please provide a classId or null to assign/unassign the student.' });
    }
    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: 'Invalid classId format.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
    }

    let message;
    if (classId === null) { // Unassign student from current class
        if (student.currentClass) {
            await Class.findByIdAndUpdate(student.currentClass, { $pull: { students: student._id } });
            message = `Student ${student.firstName} ${student.lastName} unassigned from class.`;
        } else {
            message = `Student ${student.firstName} ${student.lastName} was not assigned to any class.`;
        }
        student.currentClass = null;
        student.stream = null; // Also clear stream if unassigned from class
    } else { // Assign student to a new class
        const classObj = await Class.findById(classId);
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found.' });
        }

        // If student was already in a different class, remove them from that class's students array
        if (student.currentClass && student.currentClass.toString() !== classId.toString()) {
            await Class.findByIdAndUpdate(student.currentClass, { $pull: { students: student._id } });
        }

        // Add student to the new class's students array (using addToSet to avoid duplicates)
        await Class.findByIdAndUpdate(classId, { $addToSet: { students: student._id } });

        student.currentClass = classId;
        student.stream = stream || null; // Assign stream, or null if not provided
        message = `Student ${student.firstName} ${student.lastName} assigned to class ${classObj.name}${stream ? ' stream ' + stream : ''}.`;
    }

    await student.save();

    res.status(200).json({ success: true, message, student });
});