const User = require('../models/User');
// Optionally import other profile models if you need to perform direct operations on them
// when managing users (e.g., if changing roles requires moving profile data)
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose'); // For ObjectId validation and model lookup

// Helper to determine the profile model based on role for population
const getProfileModel = (roleMapping) => {
    switch (roleMapping) {
        case 'Teacher':
            return Teacher;
        case 'Parent':
            return Parent;
        case 'Student':
            return Student;
        // 'User' roleMapping for admin/general users without a specific profile model
        default:
            return null;
    }
};


// @desc    Get all users (admin view)
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = asyncHandler(async (req, res) => {
    // Populate profile based on roleMapping for each user
    const users = await User.find({})
                            .select('-password') // Don't return passwords
                            .populate('profileId');
    res.status(200).json({ success: true, count: users.length, users });
});

// @desc    Get single user by ID (admin view)
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
                            .select('-password') // Don't return password
                            .populate('profileId');

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
});

// @desc    Update user account details (admin view)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
// Allows updating email, password (will be hashed by pre-save hook), and isActive status
// Does NOT handle profileData updates directly, use specific profile controllers for that.
exports.updateUser = asyncHandler(async (req, res) => {
    const { email, password, isActive } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Update email
    if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userId) {
            return res.status(400).json({ message: 'Email already in use by another user.' });
        }
        user.email = email;
    }

    // Update password (pre-save hook in User model will hash it)
    if (password) {
        user.password = password;
    }

    // Update isActive status
    if (typeof isActive === 'boolean') {
        user.isActive = isActive;
    }

    // Save the user document. runValidators: true is important for password hashing
    // validateBeforeSave: false is used if other required fields (like profileId) might be temporarily invalid
    // during a complex flow (e.g., role change that unlinks profile)
    await user.save();

    // Re-fetch user with populated profile to send back
    const updatedUser = await User.findById(userId)
                                  .select('-password')
                                  .populate('profileId');

    res.status(200).json({ success: true, message: 'User account updated successfully', user: updatedUser });
});

// @desc    Update user's role (admin view)
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role) {
        return res.status(400).json({ message: 'Please provide a new role.' });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Basic role validation to ensure it's a valid enum value
    const validRoles = ['admin', 'principal', 'deputy_principal', 'class_teacher', 'subject_teacher', 'parent', 'student'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Determine new roleMapping based on the new role
    let newRoleMapping = user.roleMapping; // Default to current
    if (['principal', 'deputy_principal', 'class_teacher', 'subject_teacher'].includes(role)) {
        newRoleMapping = 'Teacher';
    } else if (role === 'parent') {
        newRoleMapping = 'Parent';
    } else if (role === 'student') {
        newRoleMapping = 'Student';
    } else if (role === 'admin') {
        newRoleMapping = 'User'; // Admin users typically map to User model itself
    }

    // Handle significant roleMapping changes:
    // If the role type changes (e.g., Teacher to Parent), the existing profileId
    // would point to the wrong model. You might want to:
    // 1. Delete the old profile document.
    // 2. Clear the profileId.
    // 3. Admin then creates a *new* profile of the correct type via the respective admin CRUD endpoint.
    if (user.roleMapping !== newRoleMapping) {
        console.warn(`Admin changing user ${userId} from roleMapping ${user.roleMapping} to ${newRoleMapping}.`);
        console.warn('Consider implications: associated profile document might need deletion/recreation for the new role type.');

        // Option: Delete old profile document if role mapping changes
        if (user.profileId && user.roleMapping && user.roleMapping !== 'User') {
            try {
                const OldProfileModel = mongoose.model(user.roleMapping);
                await OldProfileModel.findByIdAndDelete(user.profileId);
                console.log(`Deleted old profile (${user.roleMapping}) for user ${userId}.`);
            } catch (err) {
                console.error(`Failed to delete old profile for user ${userId}:`, err.message);
                // Continue, but log the error
            }
        }
        user.profileId = null; // Unlink profileId after deletion/before new creation
    }

    user.role = role;
    user.roleMapping = newRoleMapping;
    await user.save({ validateBeforeSave: false }); // Bypass validation on profileId if it became null

    res.status(200).json({ success: true, message: 'User role updated successfully', user });
});


// @desc    Delete a user account (admin view, hard delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
// This now performs a hard delete and prevents admin from deleting their own account.
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent admin from deleting or deactivating their own account via this endpoint
    if (user._id.toString() === req.user.id.toString()) {
        return res.status(400).json({ message: 'Admin cannot delete their own account via this endpoint.' });
    }

    // Hard delete the User account
    await User.findByIdAndDelete(user._id);

    // Optionally, hard delete the associated profile (Teacher, Student, Parent, etc.)
    if (user.profileId && user.roleMapping && user.roleMapping !== 'User') {
        try {
            const ProfileModel = mongoose.model(user.roleMapping);
            await ProfileModel.findByIdAndDelete(user.profileId);
            console.log(`Associated profile (${user.roleMapping}) for user ${user._id} deleted.`);
        } catch (err) {
            console.error(`Error deleting associated profile for user ${user._id}: ${err.message}`);
            // Continue, but log the error
        }
    }

    res.status(200).json({ success: true, message: 'User account and associated profile (if applicable) deleted successfully.' });
});