
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const adminRoutes = require('../routes/adminRoutes'); 
const authRoutes = require('../routes/authRoutes');

// Import models for data setup
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Result = require('../models/Result');
const AcademicCalendar = require('../models/AcademicCalendar');
const StudentProgress = require('../models/StudentProgress');
const StudentClass = require('../models/StudentClass');
const GradingScale = require('../models/GradingScale');

// Setup express app for testing
const app = express();
app.use(express.json());

// Mock the protect middleware to attach a user to the request
const mockAuth = (user) => (req, res, next) => {
    req.user = user;
    next();
};

// We need a dummy route to apply the middleware to, so we can get the user object
app.use('/api/admin', (req, res, next) => {
    // This middleware will be replaced by the mockAuth in the test
    next();
}, adminRoutes);
app.use('/api/auth', authRoutes);


describe('POST /api/admin/progress/generate', () => {
    let adminUser, student, studentClass, academicCalendar, subject, authToken;

    beforeEach(async () => {
        // 1. Create Admin User
        adminUser = await User.create({
            firstName: 'Test',
            lastName: 'Admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin',
            roleMapping: 'User'
        });
        // Manually set all permissions to true for the test admin user
        Object.keys(adminUser.permissions.administrative).forEach(key => {
            adminUser.permissions.administrative[key] = true;
        });
        await adminUser.save();

        // Generate a token for the admin user
        authToken = adminUser.getSignedJwtToken();

        // 1.5. Create default grading scale
        await GradingScale.createKenyan844Scale(adminUser._id);

        // 2. Create Academic Calendar
        academicCalendar = await AcademicCalendar.create({
            academicYear: '2025/2026',
            terms: [{
                termNumber: 1,
                name: 'Term 1',
                startDate: new Date('2025-09-01'),
                endDate: new Date('2025-11-30'),
            }],
            createdBy: adminUser._id
        });

        // 3. Create Class
        studentClass = await Class.create({
            name: 'Form 1A',
            grade: 9,
            academicYear: '2025/2026',
            classCode: 'F1A2025'
        });

        // 4. Create Student
        student = await Student.create({
            firstName: 'John',
            lastName: 'Doe',
            admissionNumber: '12345',
            dateOfBirth: new Date('2010-01-15'),
            currentClass: studentClass._id,
            userId: new mongoose.Types.ObjectId() // Dummy ID
        });

        // 4.5. Create StudentClass entry (required for progress generation)
        await StudentClass.create({
            student: student._id,
            class: studentClass._id,
            academicYear: '2025/2026',
            status: 'Active',
            enrollmentDate: new Date()
        });

        // 5. Create Subject
        subject = await Subject.create({
            name: 'Mathematics',
            code: 'MATH101',
            category: 'Core',
            creditHours: 3
        });

        // 6. Create Results for the student
        const result = new Result({
            student: student._id,
            subject: subject._id,
            class: studentClass._id,
            academicYear: '2025/2026',
            termNumber: 1,
            assessments: {
                cat1: { marks: 25, maxMarks: 30, enteredBy: adminUser._id },
                endterm: { marks: 60, maxMarks: 70, enteredBy: adminUser._id }
            },
            enteredBy: adminUser._id,
            status: 'published'
        });
        await result.save(); // This will trigger the pre-save middleware
    });

    it('should generate a student progress report successfully', async () => {
        // Act: Call the endpoint to trigger progress generation
        const response = await request(app)
            .post('/api/admin/progress/generate')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ academicYear: '2025/2026', studentId: student._id.toString() });

        expect(response.status).toBe(202);
        expect(response.body.message).toContain('Progress report generation initiated');

        // Since the generation is async, we wait a moment for it to process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Assert: Check if the StudentProgress document was created and is correct
        const progressDoc = await StudentProgress.findOne({ student: student._id, academicYear: '2025/2026' }).lean();

        expect(progressDoc).not.toBeNull();
        expect(progressDoc.class.toString()).toBe(studentClass._id.toString());
        expect(progressDoc.termlyProgress).toHaveLength(1);

        const termProgress = progressDoc.termlyProgress[0];
        expect(termProgress.termNumber).toBe(1);
        expect(termProgress.totalMarks).toBe(85); // 25 + 60
        expect(termProgress.totalMaxMarks).toBe(100); // 30 + 70
        expect(termProgress.averagePercentage).toBe(85);
        
        // Check subject performance
        expect(termProgress.subjectPerformance).toHaveLength(1);
        const subjectPerf = termProgress.subjectPerformance[0];
        expect(subjectPerf.subject.toString()).toBe(subject._id.toString());
        expect(subjectPerf.percentage).toBe(85);

        // Check overall grade calculation (based on GradingScale)
        // 85% should be grade 'A' according to the Kenyan 8-4-4 scale
        expect(termProgress.overallGrade).toBe('A');
    }, 10000); // Increase timeout for this test
});
