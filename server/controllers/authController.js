// controllers/authController.js
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const StudentClass = require('../models/StudentClass'); // Import StudentClass model
const ClassSubject = require('../models/ClassSubject'); // Import ClassSubject model for elective validation

const asyncHandler = require('express-async-handler');
const ms = require('ms');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const assignCoreSubjects = require('../utils/assignCoreSubjects'); // Import the utility for core subjects
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to send token in cookie
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id, user.role); // Use the generateToken helper

    const options = {
        expires: new Date(Date.now() + ms(process.env.JWT_EXPIRE)),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
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
                profile: user.profile // This should be populated by protect middleware on subsequent requests or explicitly returned
            }
        });
};

// Generate JWT (moved outside for reusability)
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};


// @desc    Register a new user (Admin-only initially)
// @route   POST /api/auth/register
// @access  Private (Admin) - assuming this is for admin to create users
exports.register = asyncHandler(async (req, res) => {
    const { email, password, role, profileData } = req.body;

    // Get firstName and lastName from profileData
    const { firstName, lastName } = profileData;

    // Basic validation
    if (!email || !password || !role || !profileData || !firstName || !lastName) {
        return res.status(400).json({ message: 'Please enter all required fields: firstName, lastName, email, password, role, and profileData.' });
    }

    // Determine roleMapping based on the provided role
    let roleMappingValue;
    switch (role) {
        case 'admin':
            roleMappingValue = 'Admin'; // Or 'User' if Admin is not a separate profile model
            break;
        case 'teacher':
            roleMappingValue = 'Teacher';
            break;
        case 'parent':
            roleMappingValue = 'Parent';
            break;
        case 'student':
            roleMappingValue = 'Student';
            break;
        default:
            res.status(400);
            throw new Error('Invalid role specified.');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = await User.create({
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        roleMapping: roleMappingValue,
    });

    if (newUser) {
        let profile;
        let studentClassEntry; // To hold the StudentClass document

        if (role === 'student') {
            const {
                dateOfBirth, gender, studentPhotoUrl,
                parentContactIds, classId, academicYear, electiveClassSubjectIds
            } = profileData;

            // 1. Create Student Profile
            profile = await Student.create({
                userId: newUser._id,
                firstName,
                lastName,
                dateOfBirth,
                gender,
                studentPhotoUrl,
                parentContacts: parentContactIds, // Use parentContactIds from frontend
                currentClass: classId, // Link student to their current class
                academicYear: academicYear, // Store academic year on student for current context
                admissionNumber: `ADM-${Date.now()}`, // Auto-generate a simple admission number
                stream: null, // Stream will be determined by the class (or set from profileData if available)
            });

            // 2. Create StudentClass Entry
            if (classId && academicYear) {
                studentClassEntry = await StudentClass.create({
                    student: profile._id, // Link to the Student profile
                    class: classId,
                    academicYear,
                    // Removed rollNumber as per user request to avoid duplicate key error
                    enrollmentDate: new Date(),
                    status: 'Active',
                    subjects: [], // Initialize as empty, will be populated
                });

                // 3. Assign Core Subjects
                await assignCoreSubjects(profile._id, classId, academicYear);

                // Re-fetch studentClassEntry to get updated subjects array after core assignment
                studentClassEntry = await StudentClass.findById(studentClassEntry._id);

                // 4. Assign Elective Subjects (if provided)
                if (electiveClassSubjectIds && electiveClassSubjectIds.length > 0) {
                    const validElectives = await ClassSubject.find({
                        _id: { $in: electiveClassSubjectIds },
                        class: classId,
                        academicYear: academicYear,
                        'subject.category': 'Elective',
                        isActive: true
                    }).populate('subject');

                    const validElectiveIds = validElectives.map(cs => cs._id);

                    studentClassEntry.subjects = [...new Set([...studentClassEntry.subjects.map(String), ...validElectiveIds.map(String)])];
                    await studentClassEntry.save();
                }

            } else {
                res.status(400);
                throw new Error('Class and Academic Year are required for student creation.');
            }

        } else if (role === 'teacher') {
            const { staffId, teacherType, phoneNumber } = profileData;
            profile = await Teacher.create({
                userId: newUser._id,
                firstName,
                lastName,
                staffId,
                teacherType,
                phoneNumber,
            });
        } else if (role === 'parent') {
            const { phoneNumber } = profileData;
            profile = await Parent.create({
                userId: newUser._id,
                firstName,
                lastName,
                phoneNumber,
            });
        } else if (role === 'admin') {
            profile = { _id: newUser._id, firstName: firstName, lastName: lastName };
        } else {
            res.status(400);
            throw new Error('Invalid role specified');
        }

        newUser.profileId = profile._id;
        await newUser.save();

        newUser.profile = profile;

        sendTokenResponse(newUser, 201, res);

    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});


// @desc    Log user in
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
});

// @desc    Log user out / Clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logoutUser = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'teacher' && user.profileId) {
        const teacherProfile = await Teacher.findById(user.profileId).lean();
        if (teacherProfile) {
            user.teacherType = teacherProfile.teacherType;
        }
    }

    res.status(200).json({
        success: true,
        user
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

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

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
            html: message
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

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
});
