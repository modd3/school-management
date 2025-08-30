// scripts/migrate-database.js
// Run this script to migrate your existing database to the new enhanced models

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Result = require('../models/Result');
const AcademicCalendar = require('../models/AcademicCalendar');
const GradingScale = require('../models/GradingScale');
const StudentProgress = require('../models/StudentProgress');
const Attendance = require('../models/Attendance');

class DatabaseMigration {
    constructor() {
        this.migrationLog = [];
        this.errors = [];
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        console.log(logEntry);
        this.migrationLog.push(logEntry);
    }

    error(message, error) {
        const timestamp = new Date().toISOString();
        const errorEntry = `[${timestamp}] ERROR: ${message}`;
        if (error) errorEntry += ` - ${error.message}`;
        console.error(errorEntry);
        this.errors.push({ message: errorEntry, error });
    }

    async connect() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            this.log('Connected to MongoDB');
        } catch (error) {
            this.error('Failed to connect to MongoDB', error);
            throw error;
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        this.log('Disconnected from MongoDB');
    }

    // Migration 1: Update User model with new permissions structure
    async migrateUsers() {
        this.log('Starting User model migration...');
        
        try {
            const users = await mongoose.connection.db.collection('users').find({}).toArray();
            let updatedCount = 0;

            for (const user of users) {
                const updateData = {};

                // Add default permissions if not exist
                if (!user.permissions) {
                    updateData.permissions = this.getDefaultPermissions(user.role);
                }

                // Add new fields
                if (!user.preferences) {
                    updateData.preferences = {
                        notifications: {
                            email: true,
                            sms: true,
                            whatsapp: false,
                            push: true
                        },
                        language: 'en',
                        theme: 'light'
                    };
                }

                if (!user.isActive) {
                    updateData.isActive = true;
                }

                if (!user.emailVerified) {
                    updateData.emailVerified = false;
                }

                if (!user.loginAttempts) {
                    updateData.loginAttempts = 0;
                }

                if (!user.accountLocked) {
                    updateData.accountLocked = false;
                }

                if (!user.twoFactorEnabled) {
                    updateData.twoFactorEnabled = false;
                }

                if (!user.lastPasswordChange) {
                    updateData.lastPasswordChange = user.createdAt || new Date();
                }

                if (Object.keys(updateData).length > 0) {
                    await mongoose.connection.db.collection('users').updateOne(
                        { _id: user._id },
                        { $set: updateData }
                    );
                    updatedCount++;
                }
            }

            this.log(`Updated ${updatedCount} user records`);
        } catch (error) {
            this.error('Failed to migrate users', error);
            throw error;
        }
    }

    // Migration 2: Update Result model with new assessment structure
    async migrateResults() {
        this.log('Starting Result model migration...');
        
        try {
            const results = await mongoose.connection.db.collection('results').find({}).toArray();
            let updatedCount = 0;

            for (const result of results) {
                const updateData = {};

                // Convert old result structure to new assessment structure
                if (result.marksObtained !== undefined && !result.assessments) {
                    const examTypeMap = {
                        'Opener': 'cat1',
                        'Midterm': 'cat2', 
                        'Endterm': 'endterm'
                    };

                    const assessmentType = examTypeMap[result.examType] || 'endterm';
                    
                    updateData.assessments = {};
                    updateData.assessments[assessmentType] = {
                        marks: result.marksObtained,
                        maxMarks: result.outOf,
                        date: result.createdAt || new Date(),
                        status: 'present',
                        percentage: result.percentage,
                        grade: result.grade,
                        points: result.points,
                        teacherComments: result.comment,
                        enteredBy: result.enteredBy,
                        enteredAt: result.createdAt || new Date(),
                        lastModified: result.lastModified || result.createdAt || new Date()
                    };

                    // Set overall values
                    updateData.totalMarks = result.marksObtained;
                    updateData.totalMaxMarks = result.outOf;
                    updateData.overallPercentage = result.percentage;
                    updateData.overallGrade = result.grade;
                    updateData.overallPoints = result.points;
                }

                // Add new fields with defaults
                if (!result.status) {
                    updateData.status = result.isPublished ? 'published' : 'draft';
                }

                if (!result.flags) {
                    updateData.flags = {
                        requiresAttention: false,
                        hasDiscrepancy: false,
                        isExceptional: false,
                        needsReview: false
                    };
                }

                if (!result.performanceMetrics) {
                    updateData.performanceMetrics = {
                        improvement: 0,
                        consistency: 0,
                        trend: 'stable'
                    };
                }

                if (!result.metadata) {
                    updateData.metadata = {
                        dataSource: 'manual'
                    };
                }

                if (!result.modificationHistory) {
                    updateData.modificationHistory = [];
                }

                if (Object.keys(updateData).length > 0) {
                    await mongoose.connection.db.collection('results').updateOne(
                        { _id: result._id },
                        { $set: updateData }
                    );
                    updatedCount++;
                }
            }

            this.log(`Updated ${updatedCount} result records`);
        } catch (error) {
            this.error('Failed to migrate results', error);
            throw error;
        }
    }

    // Migration 3: Create Academic Calendar from existing Terms
    async createAcademicCalendars() {
        this.log('Creating Academic Calendars from existing terms...');
        
        try {
            const terms = await mongoose.connection.db.collection('terms').find({}).toArray();
            const termsByYear = {};

            // Group terms by academic year
            terms.forEach(term => {
                if (!termsByYear[term.academicYear]) {
                    termsByYear[term.academicYear] = [];
                }
                termsByYear[term.academicYear].push(term);
            });

            // Create academic calendar for each year
            for (const [academicYear, yearTerms] of Object.entries(termsByYear)) {
                const existingCalendar = await mongoose.connection.db.collection('academiccalendars')
                    .findOne({ academicYear });

                if (existingCalendar) {
                    this.log(`Academic calendar for ${academicYear} already exists, skipping...`);
                    continue;
                }

                const calendarData = {
                    academicYear,
                    schoolInfo: {
                        name: process.env.SCHOOL_NAME || 'School Name',
                        address: process.env.SCHOOL_ADDRESS || 'School Address',
                        principalName: process.env.PRINCIPAL_NAME || 'Principal Name',
                        contactInfo: {
                            phone: process.env.SCHOOL_PHONE || '',
                            email: process.env.SCHOOL_EMAIL || '',
                            website: process.env.SCHOOL_WEBSITE || ''
                        }
                    },
                    terms: yearTerms.map(term => ({
                        termNumber: this.extractTermNumber(term.name),
                        name: term.name,
                        startDate: term.startDate,
                        endDate: term.endDate,
                        examPeriods: [
                            {
                                name: 'CAT 1',
                                startDate: new Date(term.startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
                                endDate: new Date(term.startDate.getTime() + 16 * 24 * 60 * 60 * 1000),
                                maxMarks: 30,
                                isActive: true
                            },
                            {
                                name: 'CAT 2',
                                startDate: new Date(term.startDate.getTime() + 42 * 24 * 60 * 60 * 1000),
                                endDate: new Date(term.startDate.getTime() + 44 * 24 * 60 * 60 * 1000),
                                maxMarks: 30,
                                isActive: true
                            },
                            {
                                name: 'End Term',
                                startDate: new Date(term.endDate.getTime() - 10 * 24 * 60 * 60 * 1000),
                                endDate: new Date(term.endDate.getTime() - 7 * 24 * 60 * 60 * 1000),
                                maxMarks: 40,
                                isActive: true
                            }
                        ],
                        holidays: [],
                        settings: {
                            resultEntryDeadline: new Date(term.endDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                            resultPublishDate: new Date(term.endDate.getTime() + 14 * 24 * 60 * 60 * 1000),
                            reportCardDeadline: new Date(term.endDate.getTime() + 21 * 24 * 60 * 60 * 1000)
                        },
                        status: term.isCurrent ? 'active' : 'completed'
                    })),
                    yearHolidays: [],
                    settings: {
                        gradingSystem: '8-4-4',
                        passingGrade: 'D-',
                        maxAbsences: 30,
                        notifications: {
                            resultEntryReminder: true,
                            parentNotifications: true,
                            teacherReminders: true
                        }
                    },
                    status: 'active',
                    createdBy: new mongoose.Types.ObjectId(), // You'll need to set this to an admin user ID
                    approvalStatus: 'approved',
                    version: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await mongoose.connection.db.collection('academiccalendars').insertOne(calendarData);
                this.log(`Created academic calendar for ${academicYear}`);
            }
        } catch (error) {
            this.error('Failed to create academic calendars', error);
            throw error;
        }
    }

    // Migration 4: Create default grading scales
    async createGradingScales() {
        this.log('Creating default grading scales...');
        
        try {
            // Create admin user reference for grading scales
            const adminUser = await mongoose.connection.db.collection('users')
                .findOne({ role: 'admin' });

            if (!adminUser) {
                throw new Error('No admin user found. Please create an admin user first.');
            }

            const adminId = adminUser._id;

            // Check if grading scales exist
            const existingScale = await mongoose.connection.db.collection('gradingscales')
                .findOne({});

            if (!existingScale) {
                // Create Kenyan 8-4-4 grading scale
                const kenyanScale = {
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
                    subjectOverrides: [],
                    isDefault: true,
                    isActive: true,
                    version: 1.0,
                    createdBy: adminId,
                    usageStats: {
                        totalResults: 0,
                        classesUsing: [],
                        subjectsUsing: []
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await mongoose.connection.db.collection('gradingscales').insertOne(kenyanScale);
                this.log('Created Kenyan 8-4-4 grading scale');

                // Create CBC grading scale
                const cbcScale = {
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
                    subjectOverrides: [],
                    isDefault: false,
                    isActive: true,
                    version: 1.0,
                    createdBy: adminId,
                    usageStats: {
                        totalResults: 0,
                        classesUsing: [],
                        subjectsUsing: []
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await mongoose.connection.db.collection('gradingscales').insertOne(cbcScale);
                this.log('Created CBC grading scale');
            } else {
                this.log('Grading scales already exist, skipping creation');
            }
        } catch (error) {
            this.error('Failed to create grading scales', error);
            throw error;
        }
    }

    // Migration 5: Initialize Student Progress records
    async initializeStudentProgress() {
        this.log('Initializing Student Progress records...');
        
        try {
            // Get all unique student-class-year combinations from results
            const studentClassYears = await mongoose.connection.db.collection('results').aggregate([
                {
                    $group: {
                        _id: {
                            student: '$student',
                            class: '$class',
                            academicYear: '$academicYear'
                        }
                    }
                }
            ]).toArray();

            let createdCount = 0;

            for (const combination of studentClassYears) {
                const { student, class: classId, academicYear } = combination._id;

                // Check if progress record already exists
                const existingProgress = await mongoose.connection.db.collection('studentprogresses')
                    .findOne({ student, academicYear });

                if (existingProgress) {
                    continue;
                }

                // Create basic progress record
                const progressData = {
                    student,
                    class: classId,
                    academicYear,
                    termlyProgress: [],
                    yearSummary: {
                        totalMarks: 0,
                        totalMaxMarks: 0,
                        yearAveragePercentage: 0,
                        yearMeanGrade: '',
                        yearMeanPoints: 0,
                        totalSchoolDays: 0,
                        totalPresentDays: 0,
                        yearAttendancePercentage: 100,
                        promoted: false,
                        promotionStatus: 'Pending'
                    },
                    overallTrends: {
                        improving: [],
                        declining: [],
                        stable: [],
                        inconsistent: []
                    },
                    analytics: {
                        averageImprovementRate: 0,
                        consistencyScore: 0,
                        strengthSubjects: [],
                        challengeSubjects: [],
                        riskLevel: 'low',
                        interventionNeeded: false,
                        interventionAreas: []
                    },
                    targets: {
                        termTargets: [],
                        yearTarget: {}
                    },
                    activities: [],
                    parentEngagement: {
                        meetingsAttended: 0,
                        communicationScore: 3,
                        concernsRaised: [],
                        supportProvided: []
                    },
                    lastUpdated: new Date(),
                    version: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await mongoose.connection.db.collection('studentprogresses').insertOne(progressData);
                createdCount++;
            }

            this.log(`Created ${createdCount} student progress records`);
        } catch (error) {
            this.error('Failed to initialize student progress', error);
            throw error;
        }
    }

    // Migration 6: Initialize basic attendance records
    async initializeAttendance() {
        this.log('Initializing basic attendance records...');
        
        try {
            const studentClasses = await mongoose.connection.db.collection('studentclasses')
                .find({ status: 'Active' }).toArray();

            let createdCount = 0;

            for (const studentClass of studentClasses) {
                // Check if attendance record already exists
                const existingAttendance = await mongoose.connection.db.collection('attendances')
                    .findOne({ 
                        student: studentClass.student,
                        class: studentClass.class,
                        academicYear: studentClass.academicYear
                    });

                if (existingAttendance) {
                    continue;
                }

                // Get current term (you might need to adjust this logic)
                const currentTerm = await mongoose.connection.db.collection('terms')
                    .findOne({ 
                        academicYear: studentClass.academicYear,
                        isCurrent: true 
                    }) || await mongoose.connection.db.collection('terms')
                    .findOne({ academicYear: studentClass.academicYear });

                if (!currentTerm) {
                    continue;
                }

                const attendanceData = {
                    student: studentClass.student,
                    class: studentClass.class,
                    academicYear: studentClass.academicYear,
                    term: currentTerm._id,
                    dailyAttendance: [],
                    subjectAttendance: [],
                    summary: {
                        totalDays: 0,
                        presentDays: 0,
                        absentDays: 0,
                        lateDays: 0,
                        excusedDays: 0,
                        sickDays: 0,
                        suspendedDays: 0,
                        attendancePercentage: 100,
                        lastUpdated: new Date()
                    },
                    patterns: {
                        consecutiveAbsences: 0,
                        frequentLateArrival: false,
                        attendanceRisk: 'low'
                    },
                    notifications: [],
                    medicalRecords: [],
                    leaveRequests: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await mongoose.connection.db.collection('attendances').insertOne(attendanceData);
                createdCount++;
            }

            this.log(`Created ${createdCount} attendance records`);
        } catch (error) {
            this.error('Failed to initialize attendance records', error);
            throw error;
        }
    }

    // Helper methods
    getDefaultPermissions(role) {
        switch (role) {
            case 'admin':
                return {
                    academic: {
                        canEnterResults: true,
                        canEditResults: true,
                        canViewAllResults: true,
                        canPublishResults: true,
                        subjects: [],
                        classes: []
                    },
                    administrative: {
                        canManageUsers: true,
                        canManageClasses: true,
                        canManageSubjects: true,
                        canViewReports: true,
                        canExportData: true,
                        canManageCalendar: true,
                        canSendBulkMessages: true
                    },
                    financial: {
                        canViewPayments: true,
                        canProcessPayments: true,
                        canGenerateStatements: true
                    }
                };
                
            case 'teacher':
                return {
                    academic: {
                        canEnterResults: true,
                        canEditResults: true,
                        canViewAllResults: false,
                        canPublishResults: false,
                        subjects: [],
                        classes: []
                    },
                    administrative: {
                        canManageUsers: false,
                        canManageClasses: false,
                        canManageSubjects: false,
                        canViewReports: true,
                        canExportData: false,
                        canManageCalendar: false,
                        canSendBulkMessages: false
                    },
                    financial: {
                        canViewPayments: false,
                        canProcessPayments: false,
                        canGenerateStatements: false
                    }
                };
                
            default:
                return {
                    academic: {
                        canEnterResults: false,
                        canEditResults: false,
                        canViewAllResults: false,
                        canPublishResults: false,
                        subjects: [],
                        classes: []
                    },
                    administrative: {
                        canManageUsers: false,
                        canManageClasses: false,
                        canManageSubjects: false,
                        canViewReports: false,
                        canExportData: false,
                        canManageCalendar: false,
                        canSendBulkMessages: false
                    },
                    financial: {
                        canViewPayments: false,
                        canProcessPayments: false,
                        canGenerateStatements: false
                    }
                };
        }
    }

    extractTermNumber(termName) {
        const match = termName.match(/(\d+)/);
        return match ? parseInt(match[1]) : 1;
    }

    // Main migration runner
    async runMigration() {
        try {
            await this.connect();
            
            this.log('=================================');
            this.log('Starting Database Migration');
            this.log('=================================');

            // Run migrations in sequence
            await this.migrateUsers();
            await this.migrateResults();
            await this.createAcademicCalendars();
            await this.createGradingScales();
            await this.initializeStudentProgress();
            await this.initializeAttendance();

            this.log('=================================');
            this.log('Migration completed successfully!');
            this.log('=================================');

            // Create backup of migration log
            const fs = require('fs').promises;
            const logContent = this.migrationLog.join('\n');
            await fs.writeFile(`migration-log-${Date.now()}.txt`, logContent);
            
            if (this.errors.length > 0) {
                this.log(`Migration completed with ${this.errors.length} errors. Check the log file for details.`);
                const errorContent = this.errors.map(e => e.message).join('\n');
                await fs.writeFile(`migration-errors-${Date.now()}.txt`, errorContent);
            }

        } catch (error) {
            this.error('Migration failed', error);
            throw error;
        } finally {
            await this.disconnect();
        }
    }
}

// Script execution
async function runMigration() {
    const migration = new DatabaseMigration();
    
    try {
        await migration.runMigration();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Check if this script is being run directly
if (require.main === module) {
    runMigration();
}

module.exports = DatabaseMigration;