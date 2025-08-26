// models/AcademicCalendar.js - NEW MODEL
const mongoose = require('mongoose');

const examPeriodSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        enum: ['CAT 1', 'CAT 2', 'Mid Term', 'End Term', 'Mock Exam', 'National Exam']
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    instructions: String,
    maxMarks: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true }
});

const holidaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: {
        type: String,
        enum: ['National Holiday', 'School Holiday', 'Mid-term Break', 'Half Term', 'Long Holiday'],
        required: true
    },
    description: String
});

const termSchema = new mongoose.Schema({
    termNumber: { 
        type: Number, 
        required: true,
        min: 1,
        max: 3 
    },
    name: { 
        type: String, 
        required: true // e.g., "Term 1", "First Term"
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    
    // Exam periods within this term
    examPeriods: [examPeriodSchema],
    
    // Term-specific holidays
    holidays: [holidaySchema],
    
    // Academic settings for this term
    settings: {
        resultEntryDeadline: Date,
        resultPublishDate: Date,
        reportCardDeadline: Date,
        parentMeetingDate: Date,
        graduationDate: Date // For final term
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['upcoming', 'active', 'completed', 'archived'],
        default: 'upcoming'
    },
    
    // Statistical data (calculated fields)
    stats: {
        totalSchoolDays: Number,
        totalHolidays: Number,
        totalExamDays: Number
    }
});

const academicCalendarSchema = new mongoose.Schema({
    academicYear: { 
        type: String, 
        required: true,
        unique: true,
        match: /^\d{4}\/\d{4}$/ // Format: "2024/2025"
    },
    
    // School information
    schoolInfo: {
        name: String,
        address: String,
        principalName: String,
        contactInfo: {
            phone: String,
            email: String,
            website: String
        }
    },
    
    // Terms within this academic year
    terms: [termSchema],
    
    // Year-wide holidays (Christmas, Easter, etc.)
    yearHolidays: [holidaySchema],
    
    // Academic year settings
    settings: {
        gradingSystem: {
            type: String,
            enum: ['A-F', '8-4-4', 'CBC', 'International'],
            default: '8-4-4'
        },
        passingGrade: { type: String, default: 'D' },
        maxAbsences: { type: Number, default: 30 },
        reportCardTemplate: String,
        
        // Notification settings
        notifications: {
            resultEntryReminder: { type: Boolean, default: true },
            parentNotifications: { type: Boolean, default: true },
            teacherReminders: { type: Boolean, default: true }
        }
    },
    
    // Calendar status
    status: {
        type: String,
        enum: ['draft', 'published', 'active', 'archived'],
        default: 'draft'
    },
    
    // Audit information
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    publishedAt: Date,
    archivedAt: Date,
    
    // Approval workflow
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    approvedAt: Date,
    
    // Notes and comments
    notes: String,
    version: { type: Number, default: 1 }
    
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
academicCalendarSchema.index({ academicYear: 1 });
academicCalendarSchema.index({ status: 1 });
academicCalendarSchema.index({ 'terms.status': 1 });
academicCalendarSchema.index({ createdBy: 1 });

// Virtual for current term
academicCalendarSchema.virtual('currentTerm').get(function() {
    const now = new Date();
    return this.terms.find(term => 
        term.status === 'active' || 
        (term.startDate <= now && term.endDate >= now)
    );
});

// Virtual for next term
academicCalendarSchema.virtual('nextTerm').get(function() {
    const now = new Date();
    return this.terms
        .filter(term => term.startDate > now)
        .sort((a, b) => a.startDate - b.startDate)[0];
});

// Virtual for academic year progress
academicCalendarSchema.virtual('progress').get(function() {
    const now = new Date();
    const startDate = this.terms[0]?.startDate;
    const endDate = this.terms[this.terms.length - 1]?.endDate;
    
    if (!startDate || !endDate) return 0;
    
    if (now < startDate) return 0;
    if (now > endDate) return 100;
    
    const total = endDate - startDate;
    const elapsed = now - startDate;
    return Math.round((elapsed / total) * 100);
});

// Method to get current active exam period
academicCalendarSchema.methods.getCurrentExamPeriod = function() {
    const now = new Date();
    const currentTerm = this.currentTerm;
    
    if (!currentTerm) return null;
    
    return currentTerm.examPeriods.find(exam => 
        exam.isActive && 
        exam.startDate <= now && 
        exam.endDate >= now
    );
};

// Method to get upcoming deadlines
academicCalendarSchema.methods.getUpcomingDeadlines = function(days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    const deadlines = [];
    
    this.terms.forEach(term => {
        // Check term deadlines
        if (term.settings.resultEntryDeadline && 
            term.settings.resultEntryDeadline >= now && 
            term.settings.resultEntryDeadline <= futureDate) {
            deadlines.push({
                type: 'Result Entry Deadline',
                date: term.settings.resultEntryDeadline,
                term: term.name
            });
        }
        
        if (term.settings.reportCardDeadline && 
            term.settings.reportCardDeadline >= now && 
            term.settings.reportCardDeadline <= futureDate) {
            deadlines.push({
                type: 'Report Card Deadline',
                date: term.settings.reportCardDeadline,
                term: term.name
            });
        }
        
        // Check exam deadlines
        term.examPeriods.forEach(exam => {
            if (exam.startDate >= now && exam.startDate <= futureDate) {
                deadlines.push({
                    type: 'Exam Start',
                    date: exam.startDate,
                    name: exam.name,
                    term: term.name
                });
            }
        });
    });
    
    return deadlines.sort((a, b) => a.date - b.date);
};

// Method to check if date falls within any holiday
academicCalendarSchema.methods.isHoliday = function(date) {
    const checkDate = new Date(date);
    
    // Check year-wide holidays
    const yearHoliday = this.yearHolidays.find(holiday => 
        holiday.startDate <= checkDate && holiday.endDate >= checkDate
    );
    
    if (yearHoliday) return yearHoliday;
    
    // Check term-specific holidays
    for (let term of this.terms) {
        const termHoliday = term.holidays.find(holiday => 
            holiday.startDate <= checkDate && holiday.endDate >= checkDate
        );
        if (termHoliday) return termHoliday;
    }
    
    return null;
};

// Method to calculate school days between two dates
academicCalendarSchema.methods.getSchoolDaysBetween = function(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let schoolDays = 0;
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Check if it's not a holiday
            if (!this.isHoliday(currentDate)) {
                schoolDays++;
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return schoolDays;
};

// Pre-save middleware to calculate statistics
academicCalendarSchema.pre('save', function(next) {
    this.terms.forEach(term => {
        if (term.isModified() || term.isNew) {
            term.stats = {
                totalSchoolDays: this.getSchoolDaysBetween(term.startDate, term.endDate),
                totalHolidays: term.holidays.length,
                totalExamDays: term.examPeriods.reduce((total, exam) => {
                    return total + Math.ceil((exam.endDate - exam.startDate) / (1000 * 60 * 60 * 24)) + 1;
                }, 0)
            };
        }
    });
    next();
});

// Static method to get active academic year
academicCalendarSchema.statics.getActiveYear = function() {
    return this.findOne({ status: 'active' });
};

// Static method to get current term across all years
academicCalendarSchema.statics.getCurrentTerm = async function() {
    const activeYear = await this.getActiveYear();
    return activeYear ? activeYear.currentTerm : null;
};

module.exports = mongoose.model('AcademicCalendar', academicCalendarSchema);