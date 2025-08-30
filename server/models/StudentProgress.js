// models/StudentProgress.js - NEW MODEL
const mongoose = require('mongoose');

const subjectPerformanceSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    totalMarks: {
        type: Number,
        min: 0
    },
    totalMaxMarks: {
        type: Number,
        min: 1
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    grade: String,
    points: Number,
    position: {
        type: Number,
        min: 1
    },
    totalStudents: Number,
    
    // Improvement tracking
    improvement: {
        marks: Number,        // Change from previous term
        percentage: Number,   // Percentage change
        position: Number      // Position change (negative means improvement)
    },
    
    // Performance indicators
    trend: {
        type: String,
        enum: ['improving', 'declining', 'stable', 'new']
    },
    
    // Assessment breakdown
    assessments: {
        cat1: {
            marks: Number,
            percentage: Number,
            grade: String
        },
        cat2: {
            marks: Number,
            percentage: Number,
            grade: String
        },
        endterm: {
            marks: Number,
            percentage: Number,
            grade: String
        }
    },
    
    // Teacher feedback
    teacherComments: String,
    teacherRecommendations: [String]
});

const termProgressSchema = new mongoose.Schema({
    // Term identification (no separate Term model, use embedded data)
    termId: {
        type: String,
        required: true // Format: "academicYear-termNumber" e.g. "2024/2025-1"
    },
    termName: {
        type: String,
        required: true // e.g. "Term 1", "Term 2", "Term 3"
    },
    termNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    academicYear: {
        type: String,
        required: true,
        match: /^\d{4}\/\d{4}$/
    },
    
    // Overall performance for the term
    totalMarks: {
        type: Number,
        min: 0
    },
    totalMaxMarks: {
        type: Number,
        min: 1
    },
    totalPoints: {
        type: Number,
        min: 0
    },
    averagePercentage: {
        type: Number,
        min: 0,
        max: 100
    },
    meanGradePoint: Number,
    overallGrade: String,
    
    // Class ranking
    classPosition: {
        type: Number,
        min: 1
    },
    streamPosition: {
        type: Number,
        min: 1
    },
    totalStudentsInClass: Number,
    totalStudentsInStream: Number,
    
    // Subject-wise performance
    subjectPerformance: [subjectPerformanceSchema],
    
    // Attendance for the term
    attendance: {
        totalDays: Number,
        presentDays: Number,
        absentDays: Number,
        lateCount: Number,
        attendancePercentage: Number
    },
    
    // Academic insights
    insights: {
        strengths: [String],           // Best performing subjects
        weaknesses: [String],          // Subjects needing improvement
        recommendations: [String],     // Specific recommendations
        concernAreas: [String],        // Areas of concern
        achievements: [String]         // Notable achievements
    },
    
    // Behavioral assessment
    behavior: {
        conduct: {
            type: String,
            enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'],
            default: 'Good'
        },
        punctuality: {
            type: String,
            enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'],
            default: 'Good'
        },
        participation: {
            type: String,
            enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'],
            default: 'Good'
        },
        leadership: {
            type: String,
            enum: ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'],
            default: 'Good'
        }
    },
    
    // Comments
    classTeacherComment: String,
    principalComment: String,
    parentFeedback: String,
    
    // Status
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,
    
    // Report card generation
    reportCardGenerated: {
        type: Boolean,
        default: false
    },
    reportCardUrl: String,
    reportCardGeneratedAt: Date
});

const studentProgressSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    academicYear: {
        type: String,
        required: true,
        match: /^\d{4}\/\d{4}$/
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    
    // Term-by-term progress
    termlyProgress: [termProgressSchema],
    
    // Year-end summary
    yearSummary: {
        totalMarks: Number,
        totalMaxMarks: Number,
        yearAveragePercentage: Number,
        yearMeanGrade: String,
        yearMeanPoints: Number,
        
        // Best and worst performing terms
        bestTerm: {
            termId: String, // Format: "academicYear-termNumber"
            termName: String,
            termNumber: Number,
            average: Number
        },
        worstTerm: {
            termId: String, // Format: "academicYear-termNumber"
            termName: String,
            termNumber: Number,
            average: Number
        },
        
        // Year-end statistics
        totalSchoolDays: Number,
        totalPresentDays: Number,
        yearAttendancePercentage: Number,
        
        // Promotion status
        promoted: {
            type: Boolean,
            default: false
        },
        promotionStatus: {
            type: String,
            enum: ['Promoted', 'Repeated', 'Transferred', 'Graduated', 'Pending'],
            default: 'Pending'
        },
        nextClass: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        }
    },
    
    // Trend analysis across terms
    overallTrends: {
        improving: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        }],
        declining: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        }],
        stable: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        }],
        inconsistent: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        }]
    },
    
    // Learning analytics
    analytics: {
        averageImprovementRate: Number,  // Average improvement per term
        consistencyScore: Number,        // How consistent performance is
        strengthSubjects: [String],      // Consistently strong subjects
        challengeSubjects: [String],     // Consistently challenging subjects
        
        // Predictive indicators
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        },
        interventionNeeded: {
            type: Boolean,
            default: false
        },
        interventionAreas: [String]
    },
    
    // Goals and targets
    targets: {
        termTargets: [{
            termId: String, // Format: "academicYear-termNumber"
            termName: String,
            termNumber: Number,
            targetGrade: String,
            targetPercentage: Number,
            achieved: Boolean,
            actualGrade: String,
            actualPercentage: Number
        }],
        yearTarget: {
            targetMeanGrade: String,
            targetPercentage: Number,
            parentExpectation: String,
            teacherExpectation: String
        }
    },
    
    // Extracurricular activities
    activities: [{
        activity: String,
        role: String,
        achievement: String,
        termId: String, // Format: "academicYear-termNumber"
        termName: String,
        termNumber: Number
    }],
    
    // Parent engagement
    parentEngagement: {
        meetingsAttended: Number,
        communicationScore: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        lastContactDate: Date,
        concernsRaised: [String],
        supportProvided: [String]
    },
    
    // System metadata
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    version: {
        type: Number,
        default: 1
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
studentProgressSchema.index({ student: 1, academicYear: 1 }, { unique: true });
studentProgressSchema.index({ student: 1, class: 1, academicYear: 1 });
studentProgressSchema.index({ academicYear: 1, 'termlyProgress.term': 1 });
studentProgressSchema.index({ 'analytics.riskLevel': 1 });
studentProgressSchema.index({ 'yearSummary.promotionStatus': 1 });

// Compound indexes for reporting
studentProgressSchema.index({ 
    class: 1, 
    academicYear: 1, 
    'termlyProgress.classPosition': 1 
});

// Virtual for current term progress
studentProgressSchema.virtual('currentTermProgress').get(function() {
    const now = new Date();
    return this.termlyProgress.find(term => {
        // This would need to be enhanced with actual term dates
        return term.isPublished;
    });
});

// Virtual for overall grade trend
studentProgressSchema.virtual('gradeTrend').get(function() {
    if (this.termlyProgress.length < 2) return 'insufficient_data';
    
    const firstTerm = this.termlyProgress[0];
    const lastTerm = this.termlyProgress[this.termlyProgress.length - 1];
    
    if (!firstTerm.averagePercentage || !lastTerm.averagePercentage) {
        return 'insufficient_data';
    }
    
    const improvement = lastTerm.averagePercentage - firstTerm.averagePercentage;
    
    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
});

// Method to add term progress
studentProgressSchema.methods.addTermProgress = function(termData) {
    // Check if term progress already exists
    const existingTerm = this.termlyProgress.find(term => 
        term.term.toString() === termData.term.toString()
    );
    
    if (existingTerm) {
        // Update existing term
        Object.assign(existingTerm, termData);
    } else {
        // Add new term
        this.termlyProgress.push(termData);
        // Sort by term number
        this.termlyProgress.sort((a, b) => a.termNumber - b.termNumber);
    }
    
    // Recalculate trends and analytics
    this.calculateTrends();
    this.calculateAnalytics();
    
    return this.save();
};

// Method to calculate subject trends across terms
studentProgressSchema.methods.calculateTrends = function() {
    if (this.termlyProgress.length < 2) return;
    
    const subjectTrends = new Map();
    
    // Analyze each subject across terms
    this.termlyProgress.forEach((termProgress, termIndex) => {
        termProgress.subjectPerformance.forEach(subjectPerf => {
            const subjectId = subjectPerf.subject.toString();
            
            if (!subjectTrends.has(subjectId)) {
                subjectTrends.set(subjectId, []);
            }
            
            subjectTrends.get(subjectId).push({
                termIndex,
                percentage: subjectPerf.percentage,
                position: subjectPerf.position
            });
        });
    });
    
    // Categorize trends
    this.overallTrends.improving = [];
    this.overallTrends.declining = [];
    this.overallTrends.stable = [];
    this.overallTrends.inconsistent = [];
    
    subjectTrends.forEach((performances, subjectId) => {
        if (performances.length < 2) return;
        
        const trend = this.analyzeTrend(performances);
        const objectId = new mongoose.Types.ObjectId(subjectId);
        
        switch (trend) {
            case 'improving':
                this.overallTrends.improving.push(objectId);
                break;
            case 'declining':
                this.overallTrends.declining.push(objectId);
                break;
            case 'stable':
                this.overallTrends.stable.push(objectId);
                break;
            case 'inconsistent':
                this.overallTrends.inconsistent.push(objectId);
                break;
        }
    });
};

// Helper method to analyze trend for a subject
studentProgressSchema.methods.analyzeTrend = function(performances) {
    if (performances.length < 2) return 'insufficient_data';
    
    const percentages = performances.map(p => p.percentage).filter(p => p != null);
    if (percentages.length < 2) return 'insufficient_data';
    
    // Calculate linear regression slope
    const n = percentages.length;
    const sumX = n * (n - 1) / 2; // 0 + 1 + 2 + ... + (n-1)
    const sumY = percentages.reduce((a, b) => a + b, 0);
    const sumXY = percentages.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6; // 0^2 + 1^2 + 2^2 + ... + (n-1)^2
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calculate standard deviation for inconsistency check
    const mean = sumY / n;
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // Determine trend
    if (stdDev > 15) return 'inconsistent'; // High variability
    if (slope > 2) return 'improving';      // Improving trend
    if (slope < -2) return 'declining';     // Declining trend
    return 'stable';                        // Stable performance
};

// Method to calculate learning analytics
studentProgressSchema.methods.calculateAnalytics = function() {
    if (this.termlyProgress.length === 0) return;
    
    const analytics = this.analytics || {};
    
    // Calculate average improvement rate
    if (this.termlyProgress.length > 1) {
        let totalImprovement = 0;
        let improvementCount = 0;
        
        for (let i = 1; i < this.termlyProgress.length; i++) {
            const current = this.termlyProgress[i].averagePercentage;
            const previous = this.termlyProgress[i - 1].averagePercentage;
            
            if (current != null && previous != null) {
                totalImprovement += (current - previous);
                improvementCount++;
            }
        }
        
        analytics.averageImprovementRate = improvementCount > 0 
            ? totalImprovement / improvementCount 
            : 0;
    }
    
    // Calculate consistency score (lower is better)
    const percentages = this.termlyProgress
        .map(t => t.averagePercentage)
        .filter(p => p != null);
    
    if (percentages.length > 1) {
        const mean = percentages.reduce((a, b) => a + b) / percentages.length;
        const variance = percentages.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / percentages.length;
        analytics.consistencyScore = Math.sqrt(variance);
    }
    
    // Determine risk level
    const latestTerm = this.termlyProgress[this.termlyProgress.length - 1];
    if (latestTerm && latestTerm.averagePercentage != null) {
        if (latestTerm.averagePercentage < 40) {
            analytics.riskLevel = 'high';
            analytics.interventionNeeded = true;
        } else if (latestTerm.averagePercentage < 60) {
            analytics.riskLevel = 'medium';
            analytics.interventionNeeded = analytics.averageImprovementRate < -5;
        } else {
            analytics.riskLevel = 'low';
            analytics.interventionNeeded = false;
        }
    }
    
    this.analytics = analytics;
};

// Static method to generate class progress report
studentProgressSchema.statics.getClassProgressReport = async function(classId, academicYear, termId) {
    return this.aggregate([
        {
            $match: {
                class: mongoose.Types.ObjectId(classId),
                academicYear: academicYear,
                'termlyProgress.term': mongoose.Types.ObjectId(termId)
            }
        },
        {
            $unwind: '$termlyProgress'
        },
        {
            $match: {
                'termlyProgress.term': mongoose.Types.ObjectId(termId)
            }
        },
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        {
            $unwind: '$studentInfo'
        },
        {
            $group: {
                _id: null,
                totalStudents: { $sum: 1 },
                averagePercentage: { $avg: '$termlyProgress.averagePercentage' },
                highestScore: { $max: '$termlyProgress.averagePercentage' },
                lowestScore: { $min: '$termlyProgress.averagePercentage' },
                studentsAbove80: {
                    $sum: {
                        $cond: [{ $gte: ['$termlyProgress.averagePercentage', 80] }, 1, 0]
                    }
                },
                studentsAbove60: {
                    $sum: {
                        $cond: [{ $gte: ['$termlyProgress.averagePercentage', 60] }, 1, 0]
                    }
                },
                studentsBelow40: {
                    $sum: {
                        $cond: [{ $lt: ['$termlyProgress.averagePercentage', 40] }, 1, 0]
                    }
                },
                topPerformers: {
                    $push: {
                        $cond: [
                            { $gte: ['$termlyProgress.averagePercentage', 80] },
                            {
                                student: '$studentInfo.firstName',
                                lastName: '$studentInfo.lastName',
                                admissionNumber: '$studentInfo.admissionNumber',
                                percentage: '$termlyProgress.averagePercentage',
                                position: '$termlyProgress.classPosition'
                            },
                            null
                        ]
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('StudentProgress', studentProgressSchema);