// models/Attendance.js - NEW MODEL
const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'excused', 'sick', 'suspended'],
        required: true,
        default: 'present'
    },
    arrivalTime: Date,
    departureTime: Date,
    remarks: {
        type: String,
        maxlength: 200
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    markedAt: {
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

const subjectAttendanceSchema = new mongoose.Schema({
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    period: {
        type: Number,
        min: 1,
        max: 10
    },
    attendance: [attendanceRecordSchema]
});

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    academicYear: {
        type: String,
        required: true,
        match: /^\d{4}\/\d{4}$/
    },
    term: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Term',
        required: true
    },
    
    // Daily attendance records (general attendance)
    dailyAttendance: [attendanceRecordSchema],
    
    // Subject-specific attendance (optional)
    subjectAttendance: [subjectAttendanceSchema],
    
    // Attendance summary statistics
    summary: {
        totalDays: {
            type: Number,
            default: 0
        },
        presentDays: {
            type: Number,
            default: 0
        },
        absentDays: {
            type: Number,
            default: 0
        },
        lateDays: {
            type: Number,
            default: 0
        },
        excusedDays: {
            type: Number,
            default: 0
        },
        sickDays: {
            type: Number,
            default: 0
        },
        suspendedDays: {
            type: Number,
            default: 0
        },
        attendancePercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    
    // Attendance patterns and flags
    patterns: {
        consecutiveAbsences: {
            type: Number,
            default: 0
        },
        mostAbsentDay: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        frequentLateArrival: {
            type: Boolean,
            default: false
        },
        attendanceRisk: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        }
    },
    
    // Parent/Guardian notifications
    notifications: [{
        type: {
            type: String,
            enum: ['absence_alert', 'late_alert', 'improvement_notice', 'concern_notice'],
            required: true
        },
        message: String,
        sentTo: [String], // Phone numbers or email addresses
        sentAt: {
            type: Date,
            default: Date.now
        },
        deliveryStatus: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'failed'],
            default: 'pending'
        },
        triggeredBy: {
            absentDays: Number,
            lateDays: Number,
            consecutiveAbsences: Number
        }
    }],
    
    // Medical and special circumstances
    medicalRecords: [{
        date: Date,
        condition: String,
        doctorNote: String,
        expectedReturnDate: Date,
        actualReturnDate: Date,
        documentUrl: String,
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Leave requests and approvals
    leaveRequests: [{
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        reason: {
            type: String,
            required: true,
            maxlength: 500
        },
        requestedBy: {
            type: String,
            enum: ['student', 'parent', 'guardian'],
            required: true
        },
        contactInfo: String,
        documentUrl: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        rejectionReason: String,
        actualReturnDate: Date
    }]
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
attendanceSchema.index({ student: 1, academicYear: 1, term: 1 }, { unique: true });
attendanceSchema.index({ class: 1, academicYear: 1, term: 1 });
attendanceSchema.index({ 'dailyAttendance.date': 1 });
attendanceSchema.index({ 'summary.attendancePercentage': 1 });
attendanceSchema.index({ 'patterns.attendanceRisk': 1 });
attendanceSchema.index({ 'leaveRequests.status': 1 });

// Virtual for current attendance streak
attendanceSchema.virtual('currentStreak').get(function() {
    let streak = 0;
    const sortedAttendance = [...this.dailyAttendance]
        .sort((a, b) => b.date - a.date); // Most recent first
    
    for (let record of sortedAttendance) {
        if (record.status === 'present') {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
});

// Virtual for attendance status description
attendanceSchema.virtual('attendanceStatus').get(function() {
    const percentage = this.summary.attendancePercentage;
    
    if (percentage >= 95) return 'Excellent';
    if (percentage >= 90) return 'Very Good';
    if (percentage >= 85) return 'Good';
    if (percentage >= 75) return 'Satisfactory';
    if (percentage >= 60) return 'Poor';
    return 'Critical';
});

// Pre-save middleware to calculate summary and patterns
attendanceSchema.pre('save', function(next) {
    if (this.isModified('dailyAttendance')) {
        this.calculateSummary();
        this.analyzePatterns();
    }
    next();
});

// Method to calculate attendance summary
attendanceSchema.methods.calculateSummary = function() {
    const records = this.dailyAttendance;
    
    this.summary = {
        totalDays: records.length,
        presentDays: records.filter(r => r.status === 'present').length,
        absentDays: records.filter(r => r.status === 'absent').length,
        lateDays: records.filter(r => r.status === 'late').length,
        excusedDays: records.filter(r => r.status === 'excused').length,
        sickDays: records.filter(r => r.status === 'sick').length,
        suspendedDays: records.filter(r => r.status === 'suspended').length,
        lastUpdated: new Date()
    };
    
    // Calculate attendance percentage (present + late + excused as attended)
    const attendedDays = this.summary.presentDays + this.summary.lateDays + this.summary.excusedDays;
    this.summary.attendancePercentage = this.summary.totalDays > 0 
        ? Math.round((attendedDays / this.summary.totalDays) * 100)
        : 100;
};

// Method to analyze attendance patterns
attendanceSchema.methods.analyzePatterns = function() {
    const records = [...this.dailyAttendance].sort((a, b) => a.date - b.date);
    
    // Calculate consecutive absences
    let maxConsecutiveAbsences = 0;
    let currentConsecutiveAbsences = 0;
    
    records.forEach(record => {
        if (record.status === 'absent') {
            currentConsecutiveAbsences++;
            maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, currentConsecutiveAbsences);
        } else {
            currentConsecutiveAbsences = 0;
        }
    });
    
    // Find most absent day of week
    const dayAbsences = {};
    records.forEach(record => {
        if (record.status === 'absent') {
            const dayName = record.date.toLocaleDateString('en-US', { weekday: 'long' });
            dayAbsences[dayName] = (dayAbsences[dayName] || 0) + 1;
        }
    });
    
    const mostAbsentDay = Object.keys(dayAbsences).reduce((a, b) => 
        dayAbsences[a] > dayAbsences[b] ? a : b, null);
    
    // Check for frequent late arrivals
    const frequentLateArrival = this.summary.lateDays > (this.summary.totalDays * 0.2); // More than 20%
    
    // Determine attendance risk
    let attendanceRisk = 'low';
    if (this.summary.attendancePercentage < 70 || maxConsecutiveAbsences >= 5) {
        attendanceRisk = 'high';
    } else if (this.summary.attendancePercentage < 85 || maxConsecutiveAbsences >= 3) {
        attendanceRisk = 'medium';
    }
    
    this.patterns = {
        consecutiveAbsences: maxConsecutiveAbsences,
        mostAbsentDay: mostAbsentDay,
        frequentLateArrival: frequentLateArrival,
        attendanceRisk: attendanceRisk
    };
};

// Method to mark attendance for a specific date
attendanceSchema.methods.markAttendance = function(date, status, markedBy, remarks = '') {
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Check if attendance already exists for this date
    const existingIndex = this.dailyAttendance.findIndex(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === attendanceDate.getTime();
    });
    
    const attendanceRecord = {
        date: attendanceDate,
        status: status,
        remarks: remarks,
        markedBy: markedBy,
        markedAt: new Date(),
        arrivalTime: status === 'late' ? new Date() : null
    };
    
    if (existingIndex >= 0) {
        // Update existing record
        this.dailyAttendance[existingIndex] = {
            ...this.dailyAttendance[existingIndex].toObject(),
            ...attendanceRecord,
            lastModified: new Date(),
            modifiedBy: markedBy
        };
    } else {
        // Add new record
        this.dailyAttendance.push(attendanceRecord);
    }
    
    // Recalculate summary and patterns
    this.calculateSummary();
    this.analyzePatterns();
    
    // Check if notification needs to be sent
    this.checkNotificationTriggers();
    
    return this.save();
};

// Method to check if notifications should be triggered
attendanceSchema.methods.checkNotificationTriggers = function() {
    const triggers = [];
    
    // Check for consecutive absences
    if (this.patterns.consecutiveAbsences >= 3) {
        triggers.push({
            type: 'concern_notice',
            message: `${this.patterns.consecutiveAbsences} consecutive absences detected`,
            triggeredBy: { consecutiveAbsences: this.patterns.consecutiveAbsences }
        });
    }
    
    // Check for low attendance percentage
    if (this.summary.attendancePercentage < 75) {
        triggers.push({
            type: 'absence_alert',
            message: `Attendance below 75%: ${this.summary.attendancePercentage}%`,
            triggeredBy: { absentDays: this.summary.absentDays }
        });
    }
    
    // Check for frequent lateness
    if (this.patterns.frequentLateArrival && this.summary.lateDays >= 5) {
        triggers.push({
            type: 'late_alert',
            message: `Frequent late arrivals: ${this.summary.lateDays} days`,
            triggeredBy: { lateDays: this.summary.lateDays }
        });
    }
    
    // Add notifications if they don't already exist
    triggers.forEach(trigger => {
        const existingNotification = this.notifications.find(n => 
            n.type === trigger.type && 
            n.deliveryStatus !== 'delivered' &&
            Math.abs(new Date() - n.sentAt) < 7 * 24 * 60 * 60 * 1000 // Within last 7 days
        );
        
        if (!existingNotification) {
            this.notifications.push(trigger);
        }
    });
};

// Method to request leave
attendanceSchema.methods.requestLeave = function(leaveData) {
    const leaveRequest = {
        startDate: new Date(leaveData.startDate),
        endDate: new Date(leaveData.endDate),
        reason: leaveData.reason,
        requestedBy: leaveData.requestedBy,
        contactInfo: leaveData.contactInfo,
        documentUrl: leaveData.documentUrl,
        status: 'pending'
    };
    
    this.leaveRequests.push(leaveRequest);
    return this.save();
};

// Method to approve/reject leave request
attendanceSchema.methods.processLeaveRequest = function(requestId, status, approvedBy, rejectionReason = '') {
    const request = this.leaveRequests.id(requestId);
    if (!request) {
        throw new Error('Leave request not found');
    }
    
    request.status = status;
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();
    
    if (status === 'rejected') {
        request.rejectionReason = rejectionReason;
    }
    
    // If approved, mark the days as excused
    if (status === 'approved') {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            // Skip weekends
            const dayOfWeek = date.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                this.markAttendance(new Date(date), 'excused', approvedBy, 'Approved leave');
            }
        }
    }
    
    return this.save();
};

// Method to get attendance report for a date range
attendanceSchema.methods.getAttendanceReport = function(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredRecords = this.dailyAttendance.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= start && recordDate <= end;
    });
    
    const summary = {
        totalDays: filteredRecords.length,
        presentDays: filteredRecords.filter(r => r.status === 'present').length,
        absentDays: filteredRecords.filter(r => r.status === 'absent').length,
        lateDays: filteredRecords.filter(r => r.status === 'late').length,
        excusedDays: filteredRecords.filter(r => r.status === 'excused').length,
        sickDays: filteredRecords.filter(r => r.status === 'sick').length
    };
    
    const attendedDays = summary.presentDays + summary.lateDays + summary.excusedDays;
    summary.attendancePercentage = summary.totalDays > 0 
        ? Math.round((attendedDays / summary.totalDays) * 100)
        : 100;
    
    return {
        summary,
        records: filteredRecords,
        dateRange: { startDate: start, endDate: end }
    };
};

// Static method to get class attendance summary
attendanceSchema.statics.getClassAttendanceSummary = async function(classId, academicYear, termId, date) {
    const query = {
        class: classId,
        academicYear: academicYear,
        term: termId
    };
    
    if (date) {
        query['dailyAttendance.date'] = {
            $gte: new Date(date).setHours(0, 0, 0, 0),
            $lt: new Date(date).setHours(23, 59, 59, 999)
        };
    }
    
    return this.aggregate([
        { $match: query },
        {
            $lookup: {
                from: 'students',
                localField: 'student',
                foreignField: '_id',
                as: 'studentInfo'
            }
        },
        { $unwind: '$studentInfo' },
        {
            $project: {
                student: '$studentInfo',
                attendancePercentage: '$summary.attendancePercentage',
                totalDays: '$summary.totalDays',
                presentDays: '$summary.presentDays',
                absentDays: '$summary.absentDays',
                attendanceRisk: '$patterns.attendanceRisk',
                dailyAttendance: date ? {
                    $filter: {
                        input: '$dailyAttendance',
                        as: 'record',
                        cond: {
                            $and: [
                                { $gte: ['$record.date', new Date(date).setHours(0, 0, 0, 0)] },
                                { $lt: ['$record.date', new Date(date).setHours(23, 59, 59, 999)] }
                            ]
                        }
                    }
                } : '$dailyAttendance'
            }
        }
    ]);
};

// Static method to get attendance analytics for a class
attendanceSchema.statics.getAttendanceAnalytics = async function(classId, academicYear, termId) {
    return this.aggregate([
        {
            $match: {
                class: mongoose.Types.ObjectId(classId),
                academicYear: academicYear,
                term: mongoose.Types.ObjectId(termId)
            }
        },
        {
            $group: {
                _id: null,
                totalStudents: { $sum: 1 },
                averageAttendance: { $avg: '$summary.attendancePercentage' },
                excellentAttendance: {
                    $sum: { $cond: [{ $gte: ['$summary.attendancePercentage', 95] }, 1, 0] }
                },
                goodAttendance: {
                    $sum: { $cond: [
                        { $and: [
                            { $gte: ['$summary.attendancePercentage', 85] },
                            { $lt: ['$summary.attendancePercentage', 95] }
                        ]}, 1, 0
                    ]}
                },
                poorAttendance: {
                    $sum: { $cond: [{ $lt: ['$summary.attendancePercentage', 75] }, 1, 0] }
                },
                highRiskStudents: {
                    $sum: { $cond: [{ $eq: ['$patterns.attendanceRisk', 'high'] }, 1, 0] }
                },
                totalAbsences: { $sum: '$summary.absentDays' },
                totalLateArrivals: { $sum: '$summary.lateDays' }
            }
        },
        {
            $project: {
                totalStudents: 1,
                averageAttendance: { $round: ['$averageAttendance', 2] },
                excellentRate: {
                    $round: [{ $multiply: [{ $divide: ['$excellentAttendance', '$totalStudents'] }, 100] }, 2]
                },
                goodRate: {
                    $round: [{ $multiply: [{ $divide: ['$goodAttendance', '$totalStudents'] }, 100] }, 2]
                },
                poorRate: {
                    $round: [{ $multiply: [{ $divide: ['$poorAttendance', '$totalStudents'] }, 100] }, 2]
                },
                riskRate: {
                    $round: [{ $multiply: [{ $divide: ['$highRiskStudents', '$totalStudents'] }, 100] }, 2]
                },
                totalAbsences: 1,
                totalLateArrivals: 1,
                averageAbsencesPerStudent: {
                    $round: [{ $divide: ['$totalAbsences', '$totalStudents'] }, 1]
                }
            }
        }
    ]);
};

// Static method to generate attendance alerts
attendanceSchema.statics.generateAttendanceAlerts = async function(classId, academicYear, termId) {
    const alerts = await this.aggregate([
        {
            $match: {
                class: mongoose.Types.ObjectId(classId),
                academicYear: academicYear,
                term: mongoose.Types.ObjectId(termId),
                $or: [
                    { 'summary.attendancePercentage': { $lt: 75 } },
                    { 'patterns.consecutiveAbsences': { $gte: 3 } },
                    { 'patterns.attendanceRisk': 'high' }
                ]
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
        { $unwind: '$studentInfo' },
        {
            $project: {
                student: {
                    name: { $concat: ['$studentInfo.firstName', ' ', '$studentInfo.lastName'] },
                    admissionNumber: '$studentInfo.admissionNumber'
                },
                attendancePercentage: '$summary.attendancePercentage',
                consecutiveAbsences: '$patterns.consecutiveAbsences',
                riskLevel: '$patterns.attendanceRisk',
                alerts: {
                    $filter: {
                        input: [
                            { $cond: [{ $lt: ['$summary.attendancePercentage', 75] }, 'Low Attendance', null] },
                            { $cond: [{ $gte: ['$patterns.consecutiveAbsences', 3] }, 'Consecutive Absences', null] },
                            { $cond: [{ $eq: ['$patterns.attendanceRisk', 'high'] }, 'High Risk', null] }
                        ],
                        as: 'alert',
                        cond: { $ne: ['$alert', null] }
                    }
                }
            }
        }
    ]);
    
    return alerts;
};

module.exports = mongoose.model('Attendance', attendanceSchema);