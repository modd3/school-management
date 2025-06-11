// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import JWT

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'principal', 'deputy_principal', 'class_teacher', 'subject_teacher', 'parent', 'student'],
        required: true
    },
    profileId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'roleMapping',
        //required: function() { return this.role !== 'admin'; }
    },
    roleMapping: {
        type: String,
        required: function() { return this.role !== 'admin'; }
    } // Stores the name of the referenced model (e.g., 'Teacher', 'Parent', 'Student')
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

module.exports = mongoose.model('User', userSchema);
