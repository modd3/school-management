// models/User.js - Enhanced Version
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
    },
    roleMapping: {
        type: String,
        required: function() { return this.role !== 'admin'; },
        enum: ['Teacher', 'Student', 'Parent', 'User']
    },
    
    // NEW: Enhanced permissions system
    permissions: {
        academic: {
            canEnterResults: { type: Boolean, default: false },
            canEditResults: { type: Boolean, default: false },
            canViewAllResults: { type: Boolean, default: false },
            canPublishResults: { type: Boolean, default: false },
            subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }], // Subjects they can manage
            classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }]   // Classes they can access
        },
        administrative: {
            canManageUsers: { type: Boolean, default: false },
            canManageClasses: { type: Boolean, default: false },
            canManageSubjects: { type: Boolean, default: false },
            canViewReports: { type: Boolean, default: false },
            canExportData: { type: Boolean, default: false },
            canManageCalendar: { type: Boolean, default: false },
            canSendBulkMessages: { type: Boolean, default: false }
        },
        financial: {
            canViewPayments: { type: Boolean, default: false },
            canProcessPayments: { type: Boolean, default: false },
            canGenerateStatements: { type: Boolean, default: false }
        }
    },
    
    // NEW: For parents - link to children
    children: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student' 
    }], // Only for parent role
    
    // NEW: For students - additional info
    studentInfo: {
        admissionNumber: String,
        dateOfBirth: Date,
        guardianContact: String,
        medicalInfo: String,
        bloodGroup: String,
        allergies: [String]
    },
    
    // NEW: Enhanced profile settings
    preferences: {
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: false },
            push: { type: Boolean, default: true }
        },
        language: { type: String, default: 'en' },
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' }
    },
    
    // NEW: Security and session management
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0, max: 5 },
    accountLocked: { type: Boolean, default: false },
    lockUntil: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    
    // Enhanced existing fields
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    
    // NEW: Audit trail
    isActive: { type: Boolean, default: true },
    deactivatedAt: Date,
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastPasswordChange: { type: Date, default: Date.now }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'permissions.academic.subjects': 1 });
userSchema.index({ 'permissions.academic.classes': 1 });
userSchema.index({ children: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    // Update lastPasswordChange when password is modified
    if (!this.isNew) {
        this.lastPasswordChange = Date.now();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Set default permissions based on role
userSchema.pre('save', function(next) {
    if (this.isNew && !this.permissions.academic.canEnterResults) {
        this.setDefaultPermissions();
    }
    next();
});

// Method to set default permissions based on role
userSchema.methods.setDefaultPermissions = function() {
    switch (this.role) {
        case 'admin':
            // Admins get all permissions
            this.permissions.academic = {
                canEnterResults: true,
                canEditResults: true,
                canViewAllResults: true,
                canPublishResults: true,
                subjects: [],
                classes: []
            };
            this.permissions.administrative = {
                canManageUsers: true,
                canManageClasses: true,
                canManageSubjects: true,
                canViewReports: true,
                canExportData: true,
                canManageCalendar: true,
                canSendBulkMessages: true
            };
            this.permissions.financial = {
                canViewPayments: true,
                canProcessPayments: true,
                canGenerateStatements: true
            };
            break;
            
        case 'teacher':
            this.permissions.academic = {
                canEnterResults: true,
                canEditResults: true,
                canViewAllResults: false,
                canPublishResults: false,
                subjects: [],
                classes: []
            };
            this.permissions.administrative = {
                canManageUsers: false,
                canManageClasses: false,
                canManageSubjects: false,
                canViewReports: true,
                canExportData: false,
                canManageCalendar: false,
                canSendBulkMessages: false
            };
            break;
            
        case 'parent':
        case 'student':
            // Limited permissions for parents and students
            this.permissions.academic = {
                canEnterResults: false,
                canEditResults: false,
                canViewAllResults: false,
                canPublishResults: false,
                subjects: [],
                classes: []
            };
            this.permissions.administrative = {
                canManageUsers: false,
                canManageClasses: false,
                canManageSubjects: false,
                canViewReports: false,
                canExportData: false,
                canManageCalendar: false,
                canSendBulkMessages: false
            };
            break;
    }
};

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // If we have reached max attempts and it's not locked yet, lock the account
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 30 * 60 * 1000, // 30 minutes
            accountLocked: true
        };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts after successful login
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { 
            accountLocked: false,
            lastLogin: Date.now()
        }
    });
};

// Method to generate JWT token with enhanced payload
userSchema.methods.getSignedJwtToken = function() {
    const payload = {
        id: this._id,
        role: this.role,
        permissions: this.permissions,
        children: this.children // For parents to access their children's data
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// Method to generate and hash a password reset token
userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

// Method to generate email verification token
userSchema.methods.getEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(20).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    return verificationToken;
};

// Method to check if user has specific permission
userSchema.methods.hasPermission = function(category, permission) {
    return this.permissions[category] && this.permissions[category][permission];
};

// Method to check if user can access specific subject
userSchema.methods.canAccessSubject = function(subjectId) {
    if (this.role === 'admin' || this.permissions.academic.canViewAllResults) {
        return true;
    }
    return this.permissions.academic.subjects.includes(subjectId);
};

// Method to check if user can access specific class
userSchema.methods.canAccessClass = function(classId) {
    if (this.role === 'admin' || this.permissions.academic.canViewAllResults) {
        return true;
    }
    return this.permissions.academic.classes.includes(classId);
};

module.exports = mongoose.model('User', userSchema);