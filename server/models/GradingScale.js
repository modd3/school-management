// models/GradingScale.js - NEW MODEL
const mongoose = require('mongoose');

const gradeRangeSchema = new mongoose.Schema({
    grade: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    minMarks: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    maxMarks: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    points: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: '#3498db',
        match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/ // Hex color validation
    },
    remarks: {
        type: String,
        enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement', 'Poor'],
        required: true
    }
});

const gradingScaleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        maxlength: 500
    },
    academicLevel: {
        type: String,
        enum: ['primary', 'secondary', 'tertiary'],
        required: true
    },
    gradingSystem: {
        type: String,
        enum: ['8-4-4', 'CBC', 'IGCSE', 'IB', 'A-Level', 'Custom'],
        required: true
    },
    
    // Grade ranges in descending order (A to F)
    scale: [gradeRangeSchema],
    
    // Grading configuration
    config: {
        passingGrade: {
            type: String,
            required: true,
            default: 'D'
        },
        passingPercentage: {
            type: Number,
            required: true,
            default: 50,
            min: 0,
            max: 100
        },
        maxPoints: {
            type: Number,
            required: true,
            default: 12
        },
        usePoints: {
            type: Boolean,
            default: true
        },
        roundToNearest: {
            type: Number,
            enum: [0.1, 0.5, 1],
            default: 1 // Round to nearest whole number
        }
    },
    
    // Subject-specific overrides
    subjectOverrides: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        },
        customScale: [gradeRangeSchema],
        passingGrade: String,
        passingPercentage: Number
    }],
    
    // Status and metadata
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    version: {
        type: Number,
        default: 1.0
    },
    
    // Audit fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Usage statistics
    usageStats: {
        totalResults: {
            type: Number,
            default: 0
        },
        classesUsing: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        }],
        subjectsUsing: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        }]
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
gradingScaleSchema.index({ name: 1 });
gradingScaleSchema.index({ academicLevel: 1, gradingSystem: 1 });
gradingScaleSchema.index({ isDefault: 1, isActive: 1 });
gradingScaleSchema.index({ 'subjectOverrides.subject': 1 });

// Validation: Ensure grade ranges don't overlap and are in descending order
gradingScaleSchema.pre('save', function(next) {
    // Sort scale by maxMarks in descending order
    this.scale.sort((a, b) => b.maxMarks - a.maxMarks);
    
    // Validate no overlapping ranges
    for (let i = 0; i < this.scale.length - 1; i++) {
        const current = this.scale[i];
        const next = this.scale[i + 1];
        
        if (current.minMarks <= next.maxMarks) {
            return next(new Error(`Grade ranges overlap: ${current.grade} and ${next.grade}`));
        }
        
        // Ensure min <= max for each range
        if (current.minMarks > current.maxMarks) {
            return next(new Error(`Invalid range for grade ${current.grade}: min (${current.minMarks}) > max (${current.maxMarks})`));
        }
    }
    
    // Ensure only one default grading scale per academic level
    if (this.isDefault) {
        this.constructor.updateMany(
            { 
                academicLevel: this.academicLevel, 
                _id: { $ne: this._id },
                isDefault: true 
            },
            { $set: { isDefault: false } }
        ).exec();
    }
    
    next();
});

// Method to get grade and points for a given percentage
gradingScaleSchema.methods.getGradeInfo = function(percentage, subjectId = null) {
    // Check for subject-specific override
    if (subjectId) {
        const override = this.subjectOverrides.find(o => 
            o.subject.toString() === subjectId.toString()
        );
        if (override && override.customScale.length > 0) {
            return this._findGradeInScale(percentage, override.customScale);
        }
    }
    
    // Use default scale
    return this._findGradeInScale(percentage, this.scale);
};

// Helper method to find grade in a scale array
gradingScaleSchema.methods._findGradeInScale = function(percentage, scale) {
    // Round percentage based on configuration
    const roundedPercentage = this._roundPercentage(percentage);
    
    for (let gradeRange of scale) {
        if (roundedPercentage >= gradeRange.minMarks && roundedPercentage <= gradeRange.maxMarks) {
            return {
                grade: gradeRange.grade,
                points: gradeRange.points,
                description: gradeRange.description,
                remarks: gradeRange.remarks,
                color: gradeRange.color,
                percentage: roundedPercentage,
                isPassing: this._isPassingGrade(gradeRange.grade)
            };
        }
    }
    
    // Fallback for out-of-range percentages
    return {
        grade: 'F',
        points: 0,
        description: 'Fail',
        remarks: 'Poor',
        color: '#e74c3c',
        percentage: roundedPercentage,
        isPassing: false
    };
};

// Helper method to round percentage
gradingScaleSchema.methods._roundPercentage = function(percentage) {
    const factor = 1 / this.config.roundToNearest;
    return Math.round(percentage * factor) / factor;
};

// Helper method to check if grade is passing
gradingScaleSchema.methods._isPassingGrade = function(grade) {
    const passingGradeIndex = this.scale.findIndex(g => g.grade === this.config.passingGrade);
    const currentGradeIndex = this.scale.findIndex(g => g.grade === grade);
    return currentGradeIndex <= passingGradeIndex;
};

// Method to calculate GPA for multiple results
gradingScaleSchema.methods.calculateGPA = function(results) {
    if (!results || results.length === 0) return 0;
    
    const totalPoints = results.reduce((sum, result) => {
        const gradeInfo = this.getGradeInfo(result.percentage, result.subjectId);
        return sum + gradeInfo.points;
    }, 0);
    
    return (totalPoints / results.length).toFixed(2);
};

// Method to get grade distribution statistics
gradingScaleSchema.methods.getGradeDistribution = function(percentages) {
    const distribution = {};
    
    // Initialize distribution with all grades
    this.scale.forEach(gradeRange => {
        distribution[gradeRange.grade] = {
            count: 0,
            percentage: 0,
            description: gradeRange.description,
            color: gradeRange.color
        };
    });
    
    // Count occurrences
    percentages.forEach(percentage => {
        const gradeInfo = this.getGradeInfo(percentage);
        if (distribution[gradeInfo.grade]) {
            distribution[gradeInfo.grade].count++;
        }
    });
    
    // Calculate percentages
    const total = percentages.length;
    Object.keys(distribution).forEach(grade => {
        distribution[grade].percentage = total > 0 
            ? ((distribution[grade].count / total) * 100).toFixed(1)
            : 0;
    });
    
    return distribution;
};

// Static method to get default grading scale for academic level
gradingScaleSchema.statics.getDefault = function(academicLevel) {
    return this.findOne({ 
        academicLevel: academicLevel, 
        isDefault: true, 
        isActive: true 
    });
};

// Static method to create standard Kenyan 8-4-4 grading scale
gradingScaleSchema.statics.createKenyan844Scale = async function(createdBy) {
    const scale = new this({
        name: 'Kenyan 8-4-4 System',
        description: 'Standard Kenyan secondary school grading system',
        academicLevel: 'secondary',
        gradingSystem: '8-4-4',
        scale: [
            { grade: 'A', minMarks: 80, maxMarks: 100, points: 12, description: 'Excellent', color: '#27ae60', remarks: 'Excellent' },
            { grade: 'A-', minMarks: 75, maxMarks: 79, points: 11, description: 'Very Good', color: '#2ecc71', remarks: 'Very Good' },
            { grade: 'B+', minMarks: 70, maxMarks: 74, points: 10, description: 'Good Plus', color: '#3498db', remarks: 'Good' },
            { grade: 'B', minMarks: 65, maxMarks: 69, points: 9, description: 'Good', color: '#5dade2', remarks: 'Good' },
            { grade: 'B-', minMarks: 60, maxMarks: 64, points: 8, description: 'Good Minus', color: '#85c1e9', remarks: 'Good' },
            { grade: 'C+', minMarks: 55, maxMarks: 59, points: 7, description: 'Credit Plus', color: '#f39c12', remarks: 'Satisfactory' },
            { grade: 'C', minMarks: 50, maxMarks: 54, points: 6, description: 'Credit', color: '#f7dc6f', remarks: 'Satisfactory' },
            { grade: 'C-', minMarks: 45, maxMarks: 49, points: 5, description: 'Credit Minus', color: '#f8c471', remarks: 'Satisfactory' },
            { grade: 'D+', minMarks: 40, maxMarks: 44, points: 4, description: 'Pass Plus', color: '#e67e22', remarks: 'Needs Improvement' },
            { grade: 'D', minMarks: 35, maxMarks: 39, points: 3, description: 'Pass', color: '#dc7633', remarks: 'Needs Improvement' },
            { grade: 'D-', minMarks: 30, maxMarks: 34, points: 2, description: 'Pass Minus', color: '#cb4335', remarks: 'Needs Improvement' },
            { grade: 'E', minMarks: 0, maxMarks: 29, points: 1, description: 'Fail', color: '#e74c3c', remarks: 'Poor' }
        ],
        config: {
            passingGrade: 'D-',
            passingPercentage: 30,
            maxPoints: 12,
            usePoints: true,
            roundToNearest: 1
        },
        isDefault: true,
        isActive: true,
        createdBy: createdBy
    });
    
    return await scale.save();
};

// Static method to create CBC grading scale
gradingScaleSchema.statics.createCBCScale = async function(createdBy) {
    const scale = new this({
        name: 'CBC System',
        description: 'Competency Based Curriculum grading system',
        academicLevel: 'primary',
        gradingSystem: 'CBC',
        scale: [
            { grade: 'A', minMarks: 80, maxMarks: 100, points: 4, description: 'Exceeds Expectations', color: '#27ae60', remarks: 'Excellent' },
            { grade: 'B', minMarks: 65, maxMarks: 79, points: 3, description: 'Meets Expectations', color: '#3498db', remarks: 'Very Good' },
            { grade: 'C', minMarks: 50, maxMarks: 64, points: 2, description: 'Approaching Expectations', color: '#f39c12', remarks: 'Satisfactory' },
            { grade: 'D', minMarks: 0, maxMarks: 49, points: 1, description: 'Below Expectations', color: '#e74c3c', remarks: 'Needs Improvement' }
        ],
        config: {
            passingGrade: 'C',
            passingPercentage: 50,
            maxPoints: 4,
            usePoints: true,
            roundToNearest: 1
        },
        isDefault: false,
        isActive: true,
        createdBy: createdBy
    });
    
    return await scale.save();
};

module.exports = mongoose.model('GradingScale', gradingScaleSchema);