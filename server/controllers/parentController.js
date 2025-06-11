const Parent = require('../models/Parent');
const User = require('../models/User'); // Needed to create/link User accounts
const Student = require('../models/Student'); // For linking children to parents
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Create a new Parent profile (Admin-only)
// @route   POST /api/admin/parents
// @access  Private (Admin)
// This function can optionally create an associated User account if email/password are provided
exports.createParent = asyncHandler(async (req, res) => {
    const { firstName, lastName, phoneNumber, email, password, children } = req.body;

    // Basic validation for Parent profile
    if (!firstName || !lastName || !phoneNumber) {
        return res.status(400).json({ message: 'Missing required parent fields: firstName, lastName, and phoneNumber.' });
    }

    // Validation for optional User account creation
    if (email && !password) {
        return res.status(400).json({ message: 'If providing an email, a password must also be provided to create a user account.' });
    }

    // Validate and link children if provided
    if (children && children.length > 0) {
        // Ensure children is an array and contains valid ObjectIds
        if (!Array.isArray(children)) {
            return res.status(400).json({ message: 'Children must be an array of student IDs.' });
        }
        for (const childId of children) {
            if (!mongoose.Types.ObjectId.isValid(childId)) {
                return res.status(400).json({ message: `Invalid child ID format: ${childId}` });
            }
            const student = await Student.findById(childId);
            if (!student) {
                return res.status(404).json({ message: `Student with ID ${childId} not found.` });
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
        // Create an associated User account
        user = await User.create({
            email,
            password,
            role: 'parent', // Default role for a parent account
            roleMapping: 'Parent' // Links to the Parent profile model
        });
    }

    // Create the Parent profile
    const parent = await Parent.create({
        firstName,
        lastName,
        phoneNumber,
        email: email || undefined, // Store email on profile if provided (useful even if no user account)
        children: children || [], // Initialize with provided children or empty array
        userId: user ? user._id : undefined // Link to the created User account
    });

    // If a User account was created, link its profileId to this Parent profile
    if (user) {
        user.profileId = parent._id;
        await user.save();
    }

    // Link this parent to the specified children's parentContacts array
    if (children && children.length > 0) {
        await Student.updateMany(
            { _id: { $in: children } },
            { $addToSet: { parentContacts: parent._id } } // Add parent's ID to children's contacts
        );
    }

    res.status(201).json({ success: true, message: 'Parent profile created successfully', parent });
});

// @desc    Get all Parents (Admin-only)
// @route   GET /api/admin/parents
// @access  Private (Admin)
exports.getAllParents = asyncHandler(async (req, res) => {
    const parents = await Parent.find({})
                                .populate('userId', 'email role isActive') // Populate associated user info (email, role, active status)
                                .populate('children', 'firstName lastName admissionNumber currentClass'); // Populate children's basic info
    res.status(200).json({ success: true, count: parents.length, parents });
});

// @desc    Get single Parent by ID (Admin-only)
// @route   GET /api/admin/parents/:id
// @access  Private (Admin)
exports.getParentById = asyncHandler(async (req, res) => {
    const parent = await Parent.findById(req.params.id)
                                .populate('userId', 'email role isActive')
                                .populate('children', 'firstName lastName admissionNumber currentClass');
    if (!parent) {
        return res.status(404).json({ message: 'Parent not found.' });
    }
    res.status(200).json({ success: true, parent });
});

// @desc    Update Parent profile (Admin-only)
// @route   PUT /api/admin/parents/:id
// @access  Private (Admin)
exports.updateParent = asyncHandler(async (req, res) => {
    const { email, password, children, ...updateData } = req.body;
    const parentId = req.params.id;

    const parent = await Parent.findById(parentId);
    if (!parent) {
        return res.status(404).json({ message: 'Parent not found.' });
    }

    // --- Handle Children updates ---
    if (children) {
        if (!Array.isArray(children)) {
            return res.status(400).json({ message: 'Children must be an array of student IDs.' });
        }

        const oldChildrenIds = parent.children.map(c => c.toString());
        const newChildrenIds = children.map(c => c.toString());

        // Students to remove this parent from their contacts
        const childrenToRemove = oldChildrenIds.filter(id => !newChildrenIds.includes(id));
        if (childrenToRemove.length > 0) {
            await Student.updateMany(
                { _id: { $in: childrenToRemove } },
                { $pull: { parentContacts: parent._id } }
            );
        }

        // Students to add this parent to their contacts
        const childrenToAdd = newChildrenIds.filter(id => !oldChildrenIds.includes(id));
        if (childrenToAdd.length > 0) {
            for (const childId of childrenToAdd) {
                if (!mongoose.Types.ObjectId.isValid(childId)) {
                    return res.status(400).json({ message: `Invalid child ID to add: ${childId}` });
                }
                const student = await Student.findById(childId);
                if (!student) {
                    return res.status(404).json({ message: `Student with ID ${childId} not found to add.` });
                }
            }
             await Student.updateMany(
                { _id: { $in: childrenToAdd } },
                { $addToSet: { parentContacts: parent._id } }
            );
        }
        parent.children = newChildrenIds; // Update parent's children array
    }

    // --- Update associated User account if email/password provided ---
    if (parent.userId) {
        const user = await User.findById(parent.userId);
        if (user) {
            if (email && email !== user.email) {
                user.email = email;
            }
            if (password) {
                user.password = password; // pre-save hook will hash it
            }
            // If changing role here, ensure it's handled (e.g., if parent profile now linked to non-parent user)
            // For now, assume parent profile implies 'parent' role for associated user
            await user.save({ validateBeforeSave: false }); // Bypass user schema validation on password hash if not modified
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
            role: 'parent',
            roleMapping: 'Parent',
            profileId: parent._id // Link the newly created user to this parent profile
        });
        parent.userId = newUser._id; // Link parent profile to the new user
    }

    // Apply other direct updates to the parent profile
    Object.assign(parent, updateData);
    await parent.save();

    res.status(200).json({ success: true, message: 'Parent profile updated successfully', parent });
});

// @desc    Delete (Deactivate) a Parent profile (Admin-only)
// @route   DELETE /api/admin/parents/:id
// @access  Private (Admin)
// This implements a soft delete by setting isActive to false.
// It also attempts to deactivate the associated User account and unlink from children.
exports.deleteParent = asyncHandler(async (req, res) => {
    const parent = await Parent.findById(req.params.id);

    if (!parent) {
        return res.status(404).json({ message: 'Parent not found.' });
    }

    // Soft delete the Parent profile
    parent.isActive = false; // Assuming isActive field on Parent model
    await parent.save();

    // Optionally, also deactivate the associated User account
    if (parent.userId) {
        const user = await User.findById(parent.userId);
        if (user) {
            user.isActive = false; // Assuming isActive field on User model
            await user.save();
        }
    }

    // Unlink this parent from their children's parentContacts array
    if (parent.children && parent.children.length > 0) {
         await Student.updateMany(
            { _id: { $in: parent.children } },
            { $pull: { parentContacts: parent._id } }
        );
    }

    res.status(200).json({ success: true, message: 'Parent profile and associated user (if any) deactivated successfully.' });
});