// models/Result.js - Enhanced Version
const mongoose = require('mongoose');
const GradingScale = require('./GradingScale');

const assessmentSchema = new mongoose.Schema({
    marks: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    maxMarks: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'excused', 'sick', 'late'],
        default: 'present'
    },
    percentage: Number,
    grade: String,
    points: Number,
    teacherComments: {
        type: String,
        maxlength: 200
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enteredAt: {
        type: Date,
        default: Date.now
    },
    lastModified: {
        type: Date,
        default: Date.now
    },
    modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const resultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
        match: /^\d{4}\/\d{4}$/
    },
    termNumber: {
        type: Number,
        required: true,
    },
    
    // Enhanced assessment structure
    assessments: {
        cat1: assessmentSchema,
        cat2: assessmentSchema,
        endterm: assessmentSchema
    },
    
    // Calculated aggregate fields
    totalMarks: {
        type: Number,
        min: 0,
    },
    totalMaxMarks: {
        type: Number,
        min: 1,
    },
    overallPercentage: {
        type: Number,
        min: 0,
        max: 100,
    },
    overallGrade: {
        type: String,
        trim: true,
    },
    overallPoints: {
        type: Number,
        min: 0,
    },
    
    // Position and ranking
    subjectPosition: {
        type: Number,
        min: 1
    },
    classPosition: {
        type: Number,
        min: 1
    },
    streamPosition: {
        type: Number,
        min: 1
    },
    totalStudentsInSubject: Number,
    
    // Performance analysis
    performanceMetrics: {
        improvement: Number, // Compared to previous term (percentage change)
        consistency: Number, // Standard deviation of assessment scores
        trend: {
            type: String,
            enum: ['improving', 'declining', 'stable', 'inconsistent']
        },
        strongestAssessment: {
            type: String,
            enum: ['cat1', 'cat2', 'endterm']
        },
        weakestAssessment: {
            type: String,
            enum: ['cat1', 'cat2', 'endterm']
        }
    },
    
    // Comments and feedback
    teacherComments: {
        type: String,
        maxlength: 500,
    },
    classTeacherComments: {
        type: String,
        maxlength: 500,
    },
    
    // Status and publishing
    status: {
        type: String,
        enum: ['draft', 'submitted', 'verified', 'published', 'archived'],
        default: 'draft'
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    publishedAt: Date,
    publishedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Audit trail
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    
    // Enhanced tracking
    lastModified: {
        type: Date,
        default: Date.now,
    },
    modificationHistory: [{
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        modifiedAt: {
            type: Date,
            default: Date.now
        },
        changes: mongoose.Schema.Types.Mixed, // Store what was changed
        reason: String
    }],
    
    // Flags for special cases
    flags: {
        requiresAttention: { type: Boolean, default: false },
        hasDiscrepancy: { type: Boolean, default: false },
        isExceptional: { type: Boolean, default: false }, // Very high or very low performance
        needsReview: { type: Boolean, default: false }
    },
    
    // Additional metadata
    metadata: {
        dataSource: {
            type: String,
            enum: ['manual', 'bulk_import', 'api', 'mobile'],
            default: 'manual'
        },
        importBatch: String, // For tracking bulk imports
        originalFile: String, // If imported from file
        externalId: String // For integration with other systems
    }
    
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance optimization
resultSchema.index({ student: 1, academicYear: 1, termNumber: 1 });
resultSchema.index({ student: 1, subject: 1, termNumber: 1, academicYear: 1 }, { unique: true });
resultSchema.index({ subject: 1, class: 1, termNumber: 1, academicYear: 1 });
resultSchema.index({ class: 1, termNumber: 1, academicYear: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ isPublished: 1, publishedAt: 1 });
resultSchema.index({ 'flags.requiresAttention': 1 });
resultSchema.index({ overallPercentage: 1 });

// Virtual for attendance percentage across all assessments
resultSchema.virtual('attendancePercentage').get(function() {
    const assessments = [this.assessments.cat1, this.assessments.cat2, this.assessments.endterm];
    const presentCount = assessments.filter(a => a && a.status === 'present').length;
    return (presentCount / assessments.length) * 100;
});

// Virtual for completion status
resultSchema.virtual('completionStatus').get(function() {
    const hasCAT1 = this.assessments.cat1 && this.assessments.cat1.marks !== undefined;
    const hasCAT2 = this.assessments.cat2 && this.assessments.cat2.marks !== undefined;
    const hasEndterm = this.assessments.endterm && this.assessments.endterm.marks !== undefined;
    
    const completed = [hasCAT1, hasCAT2, hasEndterm].filter(Boolean).length;
    return {
        completed,
        total: 3,
        percentage: (completed / 3) * 100,
        isComplete: completed === 3
    };
});

// Pre-save middleware to calculate aggregates and performance metrics
resultSchema.pre('save', async function (next) {
    try {
        // Calculate totals if assessments are provided
        if (this.assessments.cat1 || this.assessments.cat2 || this.assessments.endterm) {
            await this.calculateAggregates();
            await this.calculatePerformanceMetrics();
            this.setFlags();
        }

        // Track modifications
        if (this.isModified() && !this.isNew) {
            const changes = this.getChanges();
            if (Object.keys(changes).length > 0) {
                this.modificationHistory.push({
                    modifiedBy: this.modifiedBy || this.enteredBy,
                    modifiedAt: new Date(),
                    changes: changes
                });
            }
            this.lastModified = Date.now();
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Method to calculate aggregate marks, percentages, grades, and points
resultSchema.methods.calculateAggregates = async function() {
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let assessmentCount = 0;

    // Get the appropriate grading scale
    const gradingScale = await GradingScale.getDefault('secondary');
    if (!gradingScale) {
        throw new Error('No default grading scale found');
    }

    // Process each assessment
    for (const assessmentType of ['cat1', 'cat2', 'endterm']) {
        const assessment = this.assessments[assessmentType];
        if (assessment && assessment.marks !== undefined && assessment.maxMarks) {
            // Calculate percentage for individual assessment
            assessment.percentage = (assessment.marks / assessment.maxMarks) * 100;
            
            // Calculate grade and points for individual assessment
            const gradeInfo = gradingScale.getGradeInfo(assessment.percentage, this.subject);
            assessment.grade = gradeInfo.grade;
            assessment.points = gradeInfo.points;
            
            // Add to totals
            totalMarks += assessment.marks;
            totalMaxMarks += assessment.maxMarks;
            assessmentCount++;
        }
    }

    // Calculate overall aggregates
    if (totalMaxMarks > 0) {
        this.totalMarks = totalMarks;
        this.totalMaxMarks = totalMaxMarks;
        this.overallPercentage = (totalMarks / totalMaxMarks) * 100;

        const overallGradeInfo = gradingScale.getGradeInfo(this.overallPercentage, this.subject);
        this.overallGrade = overallGradeInfo.grade;
        this.overallPoints = overallGradeInfo.points;
    }
};

// Method to calculate performance metrics
resultSchema.methods.calculatePerformanceMetrics = async function() {
    try {
        // Get previous term result for comparison
        const previousResult = await this.constructor.findOne({
            student: this.student,
            subject: this.subject,
            class: this.class,
            academicYear: this.academicYear,
            termNumber: { $lt: this.termNumber },
            isPublished: true
        }).sort({ termNumber: -1 });

        // Calculate improvement
        if (previousResult && previousResult.overallPercentage !== undefined) {
            this.performanceMetrics.improvement = 
                this.overallPercentage - previousResult.overallPercentage;
        }

        // Calculate consistency (standard deviation of assessments)
        const scores = [];
        if (this.assessments.cat1 && this.assessments.cat1.percentage !== undefined) {
            scores.push(this.assessments.cat1.percentage);
        }
        if (this.assessments.cat2 && this.assessments.cat2.percentage !== undefined) {
            scores.push(this.assessments.cat2.percentage);
        }
        if (this.assessments.endterm && this.assessments.endterm.percentage !== undefined) {
            scores.push(this.assessments.endterm.percentage);
        }

        if (scores.length > 1) {
            const mean = scores.reduce((a, b) => a + b) / scores.length;
            const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
            this.performanceMetrics.consistency = Math.sqrt(variance);
        }

        // Determine trend
        if (this.performanceMetrics.improvement > 5) {
            this.performanceMetrics.trend = 'improving';
        } else if (this.performanceMetrics.improvement < -5) {
            this.performanceMetrics.trend = 'declining';
        } else if (this.performanceMetrics.consistency > 15) {
            this.performanceMetrics.trend = 'inconsistent';
        } else {
            this.performanceMetrics.trend = 'stable';
        }

        // Identify strongest and weakest assessments
        const assessmentScores = {
            cat1: this.assessments.cat1?.percentage || 0,
            cat2: this.assessments.cat2?.percentage || 0,
            endterm: this.assessments.endterm?.percentage || 0
        };

        const sorted = Object.entries(assessmentScores)
            .filter(([_, score]) => score > 0)
            .sort(([,a], [,b]) => b - a);

        if (sorted.length > 0) {
            this.performanceMetrics.strongestAssessment = sorted[0][0];
            this.performanceMetrics.weakestAssessment = sorted[sorted.length - 1][0];
        }

    } catch (error) {
        console.error('Error calculating performance metrics:', error);
    }
};

// Method to set flags based on performance
resultSchema.methods.setFlags = function() {
    // Reset flags
    this.flags = {
        requiresAttention: false,
        hasDiscrepancy: false,
        isExceptional: false,
        needsReview: false
    };

    // Check for attention-requiring cases
    if (this.overallPercentage < 40) {
        this.flags.requiresAttention = true;
    }

    // Check for exceptional performance (very high or very low)
    if (this.overallPercentage >= 95 || this.overallPercentage <= 20) {
        this.flags.isExceptional = true;
    }

    // Check for discrepancies (large differences between assessments)
    if (this.performanceMetrics.consistency > 20) {
        this.flags.hasDiscrepancy = true;
        this.flags.needsReview = true;
    }

    // Check for significant improvement or decline
    if (Math.abs(this.performanceMetrics.improvement) > 20) {
        this.flags.needsReview = true;
    }
};

// Method to get detailed changes for modification history
resultSchema.methods.getChanges = function() {
    const changes = {};
    const modified = this.modifiedPaths();

    modified.forEach(path => {
        if (!path.startsWith('modificationHistory') && !path.startsWith('lastModified')) {
            changes[path] = {
                from: this.get(path, null, { getters: false }),
                to: this.get(path)
            };
        }
    });

    return changes;
};

// Static method to calculate class positions for a subject
resultSchema.statics.calculatePositions = async function(classId, subjectId, termNumber, academicYear) {
    try {
        // Get all results for this class, subject, and term, sorted by overall percentage
        const results = await this.find({
            class: classId,
            subject: subjectId,
            termNumber: termNumber,
            academicYear: academicYear,
            status: 'published',
            overallPercentage: { $exists: true, $ne: null }
        }).sort({ overallPercentage: -1 });

        // Update positions
        const updatePromises = results.map((result, index) => {
            return this.findByIdAndUpdate(result._id, {
                subjectPosition: index + 1,
                totalStudentsInSubject: results.length
            });
        });

        await Promise.all(updatePromises);
        return results.length;
    } catch (error) {
        console.error('Error calculating positions:', error);
        throw error;
    }
};

// Static method to get class performance analytics
resultSchema.statics.getClassAnalytics = async function(classId, termNumber, academicYear) {
    try {
        const analytics = await this.aggregate([
            {
                $match: {
                    class: mongoose.Types.ObjectId(classId),
                    termNumber: termNumber,
                    academicYear: academicYear,
                    status: 'published'
                }
            },
            {
                $group: {
                    _id: '$subject',
                    averagePercentage: { $avg: '$overallPercentage' },
                    highestScore: { $max: '$overallPercentage' },
                    lowestScore: { $min: '$overallPercentage' },
                    totalStudents: { $sum: 1 },
                    passCount: {
                        $sum: {
                            $cond: [{ $gte: ['$overallPercentage', 50] }, 1, 0]
                        }
                    },
                    excellentCount: {
                        $sum: {
                            $cond: [{ $gte: ['$overallPercentage', 80] }, 1, 0]
                        }
                    },
                    averagePoints: { $avg: '$overallPoints' }
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'subjectInfo'
                }
            },
            {
                $unwind: '$subjectInfo'
            },
            {
                $project: {
                    subjectName: '$subjectInfo.name',
                    subjectCode: '$subjectInfo.code',
                    averagePercentage: { $round: ['$averagePercentage', 2] },
                    highestScore: '$highestScore',
                    lowestScore: '$lowestScore',
                    totalStudents: '$totalStudents',
                    passRate: {
                        $round: [
                            { $multiply: [{ $divide: ['$passCount', '$totalStudents'] }, 100] },
                            2
                        ]
                    },
                    excellenceRate: {
                        $round: [
                            { $multiply: [{ $divide: ['$excellentCount', '$totalStudents'] }, 100] },
                            2
                        ]
                    },
                    averagePoints: { $round: ['$averagePoints', 2] }
                }
            },
            {
                $sort: { averagePercentage: -1 }
            }
        ]);

        return analytics;
    } catch (error) {
        console.error('Error getting class analytics:', error);
        throw error;
    }
};

// Static method to get student progress over terms
resultSchema.statics.getStudentProgress = async function(studentId, academicYear) {
    try {
        const progress = await this.aggregate([
            {
                $match: {
                    student: mongoose.Types.ObjectId(studentId),
                    academicYear: academicYear,
                    status: 'published'
                }
            },
            {
                $lookup: {
                    from: 'subjects',
                    localField: 'subject',
                    foreignField: '_id',
                    as: 'subjectInfo'
                }
            },
            {
                $unwind: '$subjectInfo'
            },
            {
                $group: {
                    _id: '$termNumber',
                    termNumber: { $first: '$termNumber' },
                    averagePercentage: { $avg: '$overallPercentage' },
                    totalPoints: { $sum: '$overallPoints' },
                    subjects: {
                        $push: {
                            subject: '$subjectInfo.name',
                            subjectCode: '$subjectInfo.code',
                            percentage: '$overallPercentage',
                            grade: '$overallGrade',
                            points: '$overallPoints',
                            position: '$subjectPosition',
                            improvement: '$performanceMetrics.improvement'
                        }
                    }
                }
            },
            {
                $sort: { termNumber: 1 }
            }
        ]);

        return progress;
    } catch (error) {
        console.error('Error getting student progress:', error);
        throw error;
    }
};

module.exports = mongoose.model('Result', resultSchema);