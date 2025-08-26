// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // Assuming your User model path
const Teacher = require('../models/Teacher'); // Ensure these are correctly imported if used for population
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Class = require('../models/Class'); // Added Class model for student currentClass population

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // else if (req.cookies.token) {
  //   // Set token from cookie (if you're using cookie-parser for JWT in cookies)
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    res.status(401);
    throw new Error('Not authorized to access this route, no token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user by ID from the token payload
    let user = await User.findById(decoded.id).select('-password').lean(); // Use .lean() for plain JS objects

    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    // Populate profile based on the user's main 'role'
    // Ensure 'profileId' is correctly referenced in your User model
    if (user.role === 'teacher') {
      user.profile = await Teacher.findById(user.profileId).select('firstName lastName staffId teacherType phoneNumber subjectsTaught').lean();
      // If subjectsTaught needs further population, do it here
    } else if (user.role === 'student') {
      user.profile = await Student.findById(user.profileId).select('firstName lastName admissionNumber dateOfBirth gender currentClass stream parentContacts studentPhotoUrl').lean();
      // Further populate currentClass and parentContacts within the student profile
      if (user.profile && user.profile.currentClass) {
        user.profile.currentClass = await Class.findById(user.profile.currentClass).select('name stream').lean();
      }
      if (user.profile && user.profile.parentContacts && user.profile.parentContacts.length > 0) {
        // Assuming parentContacts in Student model stores Parent _ids
        user.profile.parentContacts = await Parent.find({ _id: { $in: user.profile.parentContacts } }).select('firstName lastName phoneNumber').lean();
      }
    } else if (user.role === 'parent') {
      user.profile = await Parent.findById(user.profileId).select('firstName lastName phoneNumber').lean();
    }
    // For 'admin', no specific profile model needed unless you have an AdminProfile model

    req.user = user; // Attach the user object (with populated profile) to the request

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  // Flatten if accidentally passed an array (e.g., authorize(['admin']) instead of authorize('admin'))
  const allowedRoles = Array.isArray(roles[0]) ? roles[0].map(r => r.trim()) : roles.map(r => r.trim());

  return (req, res, next) => {
    const userRole = req.user.role ? req.user.role.trim() : '';

    if (!allowedRoles.includes(userRole)) {
      res.status(403);
      throw new Error(`User role ${userRole} is not authorized to access this route`);
    }

    next();
  };
};

// New middleware to check for specific granular permissions
exports.hasPermission = (category, permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            res.status(403);
            throw new Error('Not authorized, user permissions not found.');
        }

        // Check if the user has the specific permission
        if (req.user.permissions[category] && req.user.permissions[category][permission]) {
            next();
        } else {
            res.status(403);
            throw new Error(`Not authorized, missing ${category}.${permission} permission.`);
        }
    };
};