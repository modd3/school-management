// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler'); // For handling async errors without try/catch in every middleware
const User = require('../models/User'); // Assuming your User model is here

// Protect routes: Verifies JWT token and attaches user to request
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in headers (Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user from DB using decoded ID and attach to request
            // We want to populate the profile data based on the roleMapping
            req.user = await User.findById(decoded.id).select('-password'); // Exclude password from req.user
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Populate the specific profile (Teacher, Student, Parent, etc.)
            // based on the role and profileId stored in the User model
            const profileModelName = req.user.roleMapping;
            if (profileModelName) {
                req.user.profile = await mongoose.model(profileModelName).findById(req.user.profileId);
                if (!req.user.profile) {
                    return res.status(401).json({ message: 'Not authorized, user profile not found' });
                }
            } else {
                 return res.status(401).json({ message: 'Not authorized, user role mapping missing' });
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
});

// Authorize roles: Checks if the user has one of the allowed roles
const authorize = (roles = []) => {
    // roles can be a single string or an array of strings
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Not authorized, no user role' });
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Not authorized, role ${req.user.role} is not allowed` });
        }
        next();
    };
};

module.exports = { protect, authorize };
