// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import JWT
const crypto = require('crypto'); // Import crypto for password reset token generation

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'parent', 'student'],
        required: true
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'roleMapping',
        //required: function() { return this.role !== 'admin'; }
    },
    roleMapping: {
        type: String,
        required: function() { return this.role !== 'admin'; },
        enum: ['Teacher', 'Student', 'Parent', 'User']
    }, // Stores the name of the referenced model (e.g., 'Teacher', 'Parent', 'Student')
    passwordResetToken: String,
    passwordResetExpires: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};
// Method to generate and hash a password reset token
userSchema.methods.getResetPasswordToken = function() {
    // Generate the random token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash the token and set to passwordResetToken field
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expire time (e.g., 10 minutes)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken; // Return the *unhashed* token (we'll need this to send in the email)
};

module.exports = mongoose.model('User', userSchema);
