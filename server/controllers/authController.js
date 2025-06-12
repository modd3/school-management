// controllers/authController.js
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const asyncHandler = require('express-async-handler'); // For handling async errors
const ms = require('ms'); // For handling time in milliseconds
const crypto = require('crypto'); // For generating secure tokens
const sendEmail = require('../utils/email'); // For sending emails

// Helper function to send token in cookie
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + ms(process.env.JWT_EXPIRE)), // Convert days to milliseconds
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

// @desc    Log user out / Clear cookie
// @route   GET /api/auth/logout
// @access  Private (though usually just a redirect for logged in users)
exports.logoutUser = asyncHandler(async (req, res, next) => {
    // Clear the JWT cookie
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds (effectively immediate)
        httpOnly: true,
        // If your frontend and backend are on different domains (e.g., localhost:3000 and localhost:5000),
        // you might need to specify sameSite: 'none' and secure: true for production.
        // For local development with different ports, this can be tricky.
        // If you face issues, ensure sameSite is correctly set based on your setup.
        // sameSite: 'strict', // Or 'lax', or 'none' (with secure: true)
        // secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
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


// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'There is no user with that email address' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL pointing to your frontend form
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const message = `
        <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process:</p>
        <p><a href="${resetURL}">${resetURL}</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your Password Reset Request (valid for 10 minutes)',
            html: message // Send as HTML
        });

        res.status(200).json({ success: true, message: 'Password reset email sent successfully. Please check your inbox.' });
    } catch (err) {
        console.error("Error sending email:", err);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return res.status(500).json({ message: 'Error sending password reset email. Please try again later.' });
    }
});

// @desc    Reset password
// @route   PATCH /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await User.findOne({
        passwordResetToken: resetToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token. Please request a new password reset.' });
    }

    if (req.body.password !== req.body.passwordConfirm) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // This will trigger the password hashing middleware

    // After successfully resetting, you can either:
    // 1. Automatically log them in (generate and send new JWT via cookie)
    // 2. Just send a success message and let the frontend redirect them to the login page.
    // For simplicity and security, it's often better to just send a success message
    // and let the frontend handle the redirect to the login page for a fresh login.

    // Option 2 (Recommended for a clearer flow):
    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });

    // If you want to automatically log them in (Option 1 - remove the above res.status line):
    /*
    const token = user.getSignedJwtToken();
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    res
        .status(200)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            token,
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
                // ... other user details you want to send ...
            },
            message: 'Password reset successfully and logged in.'
        });
    */
});