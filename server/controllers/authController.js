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
const { assignElectiveSubjects, getAvailableElectives } = require('../utils/assignElectiveSubjects'); // Import elective subjects utility
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

// Note: Using proper utility functions imported from utils/


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

    // Create User (password will be hashed by the pre-save hook in User model)
    const newUser = await User.create({
        email,
        password,
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
                parentContactIds, classId, academicYear, stream // Added stream from profileData
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
                stream: stream || null, // Set stream from profileData or null
            });

            // 2. Create StudentClass Entry
            if (classId && academicYear) {
                studentClassEntry = await StudentClass.create({
                    student: profile._id, // Link to the Student profile
                    class: classId,
                    academicYear,
                    enrollmentDate: new Date(),
                    status: 'Active',
                    subjects: [], // Initialize as empty, will be populated
                });

                console.log(`🎓 Creating student: ${firstName} ${lastName} for class ${classId}, year ${academicYear}`);
                
                // 3. Assign ALL Core Subjects across all terms (using proper utility)
                const coreResult = await assignCoreSubjects(profile._id, classId, academicYear);
                console.log(`📚 Core subjects result:`, coreResult);

                // 4. Assign Elective Subjects (if provided, otherwise use defaults)
                let electiveResult = { electivesAssigned: 0, electiveIds: [] };
                
                try {
                    if (profileData.electiveClassSubjectIds && profileData.electiveClassSubjectIds.length > 0) {
                        console.log(`   Frontend provided ${profileData.electiveClassSubjectIds.length} elective selections`);
                        console.log(`   Frontend IDs:`, profileData.electiveClassSubjectIds);
                        
                        // If frontend provided subject IDs instead of ClassSubject IDs, expand them
                        console.log(`   📋 Getting available electives for expansion...`);
                        const availableElectives = await getAvailableElectives(classId, academicYear);
                        console.log(`   📋 Available electives result:`, {
                            success: availableElectives.success,
                            totalElectives: availableElectives.totalElectives,
                            allElectivesCount: availableElectives.allElectives?.length
                        });
                        
                        const expandedClassSubjectIds = [];
                        
                        profileData.electiveClassSubjectIds.forEach(selectedId => {
                            console.log(`   🔍 Processing selected ID: ${selectedId}`);
                            // Check if it's a subject ID that needs expansion
                            const elective = availableElectives.allElectives.find(e => e.subjectId === selectedId);
                            if (elective) {
                                // Expand subject ID to all its ClassSubject IDs (across all terms)
                                console.log(`   ✅ Expanding subject ${elective.subject.name} to ${elective.classSubjectIds.length} ClassSubjects`);
                                console.log(`      ClassSubject IDs:`, elective.classSubjectIds);
                                expandedClassSubjectIds.push(...elective.classSubjectIds);
                            } else {
                                // Already a ClassSubject ID, use as-is
                                console.log(`   ⚠️  ID ${selectedId} not found in available electives - treating as ClassSubject ID`);
                                expandedClassSubjectIds.push(selectedId);
                            }
                        });
                        
                        console.log(`   📦 Expanded to ${expandedClassSubjectIds.length} ClassSubject assignments:`, expandedClassSubjectIds);
                        
                        // Use expanded ClassSubject IDs for assignment
                        electiveResult = await assignElectiveSubjects(profile._id, classId, academicYear, expandedClassSubjectIds);
                    } else {
                        // Use default elective assignment (one from each group)
                        console.log(`   Using default elective assignment`);
                        electiveResult = await assignElectiveSubjects(profile._id, classId, academicYear);
                    }
                    
                    console.log(`🎨 Elective subjects result:`, electiveResult);
                } catch (electiveError) {
                    console.error(`❌ Error in elective assignment:`, electiveError);
                    // Set a fallback result so the response still works
                    electiveResult = { 
                        electivesAssigned: 0, 
                        totalClassSubjects: 0,
                        electiveIds: [],
                        error: electiveError.message 
                    };
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
                email, // Add email from the main registration data
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

        // For student creation, include subject assignment details in response
        if (role === 'student' && typeof coreResult !== 'undefined' && typeof electiveResult !== 'undefined') {
            const token = generateToken(newUser._id, newUser.role);
            const options = {
                expires: new Date(Date.now() + ms(process.env.JWT_EXPIRE)),
                httpOnly: true
            };
            if (process.env.NODE_ENV === 'production') {
                options.secure = true;
            }
            
            return res.status(201)
               .cookie('token', token, options)
               .json({
                    success: true,
                    token,
                    user: {
                        id: newUser._id,
                        email: newUser.email,
                        role: newUser.role,
                        profileId: newUser.profileId,
                        profile: newUser.profile
                    },
                    subjectAssignment: {
                        coreSubjects: {
                            assigned: coreResult.coreSubjectsAssigned,
                            totalClassSubjects: coreResult.totalClassSubjects,
                            details: `${coreResult.coreSubjectsAssigned} core subjects assigned across all terms (${coreResult.totalClassSubjects} total enrollments)`
                        },
                        electives: {
                            assigned: electiveResult.electivesAssigned,
                            totalClassSubjects: electiveResult.totalClassSubjects || electiveResult.electivesAssigned,
                            details: `${electiveResult.electivesAssigned} elective subjects assigned${electiveResult.totalClassSubjects ? ` (${electiveResult.totalClassSubjects} total enrollments)` : ''}`
                        },
                        totalUniqueSubjects: coreResult.coreSubjectsAssigned + electiveResult.electivesAssigned,
                        totalEnrollments: coreResult.totalClassSubjects + (electiveResult.totalClassSubjects || electiveResult.electivesAssigned)
                    }
                });
        }

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

    try {
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide both email and password' 
            });
        }

        // Case-insensitive email search
        const user = await User.findOne({ 
            email: { $regex: new RegExp(`^${email}$`, 'i') } 
        }).select('+password');

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials - user not found' 
            });
        }

        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials - password mismatch' 
            });
        }

        // Additional check for student profiles
        if (user.role === 'student') {
            const studentProfile = await Student.findById(user.profileId);
            if (!studentProfile) {
                console.warn(`Student profile missing for user ${user._id}`);
                // Continue login but warn in logs
            }
        }

        sendTokenResponse(user, 200, res);
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login',
            error: error.message 
        });
    }
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
