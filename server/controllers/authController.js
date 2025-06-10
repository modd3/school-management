// controllers/authController.js
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const asyncHandler = require('express-async-handler'); // For handling async errors

// Helper function to send token in cookie
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_EXPIRE * 24 * 60 * 60 * 1000), // Convert days to milliseconds
        httpOnly: true // Prevent client-side JS from accessing token
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true; // Send cookie only on HTTPS
    }

    res.status(statusCode)
       .cookie('token', token, options)
       .json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profileId: user.profileId,
                profile: user.profile // This will be populated by protect middleware on subsequent requests
            }
        });
};


// @desc    Register a new user (Admin-only initially)
// @route   POST /api/auth/register
// @access  Private (Admin)
exports.register = asyncHandler(async (req, res) => {
    const { email, password, role, profileData } = req.body;

    // Basic validation
    if (!email || !password || !role || !profileData) {
        return res.status(400).json({ message: 'Please enter all required fields: email, password, role, and profileData.' });
    }

    // Determine which profile model to create based on the role
    let profileModel;
    let profileMapping;
    switch (role) {
        case 'admin':
            // For admin, profileData might be minimal or a dedicated Admin profile
            profileModel = null; // Admins might not need a separate profile doc in the same way
            profileMapping = 'User'; // Or create an 'Admin' model if needed
            break;
        case 'principal':
        case 'deputy_principal':
        case 'class_teacher':
        case 'subject_teacher':
            profileModel = Teacher;
            profileMapping = 'Teacher';
            break;
        case 'parent':
            profileModel = Parent;
            profileMapping = 'Parent';
            break;
        case 'student':
            profileModel = Student;
            profileMapping = 'Student';
            break;
        default:
            return res.status(400).json({ message: 'Invalid role specified.' });
    }

    // Create the User first
    const user = await User.create({ email, password, role, roleMapping: profileMapping });

    // Create the associated profile document
    if (profileModel) {
        // Associate the new user's ID with the profile
        const profile = await profileModel.create({ ...profileData, userId: user._id });
        user.profileId = profile._id; // Link the profile's ID to the User
        await user.save(); // Save user again to update profileId
    }
    // For admin, profileId will just be the user's own ID or handled differently

    // For initial Admin creation, you might remove `protect` and `authorize` and handle it manually or via a setup script.
    // For subsequent users, ensure the admin token is used.

    sendTokenResponse(user, 201, res);
});


// @desc    Log user in
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password'); // Select password explicitly

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
    // req.user is already populated by the protect middleware
    res.status(200).json({
        success: true,
        user: req.user // Contains basic user data + populated profile
    });
});
