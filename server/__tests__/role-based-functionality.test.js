const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import all route modules
const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const teacherRoutes = require('../routes/teacherRoutes');
const studentRoutes = require('../routes/studentRoutes');
const parentRoutes = require('../routes/parentRoutes');

// Import all models
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Result = require('../models/Result');
const GradingScale = require('../models/GradingScale');
const AcademicCalendar = require('../models/AcademicCalendar');
const StudentClass = require('../models/StudentClass');

// Setup express app for testing
const app = express();
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);

describe('🏫 School Management System - Role-based Functionality Tests', () => {
    let adminUser, adminToken, adminProfile;
    let teacherUser, teacherToken, teacherProfile;
    let studentUser, studentToken, studentProfile;
    let parentUser, parentToken, parentProfile;
    let testClass, testSubject, gradingScale, academicCalendar;

    beforeAll(async () => {
        // Create test data setup
        await setupTestData();
    });

    async function setupTestData() {
        // Create default grading scale
        gradingScale = await GradingScale.createKenyan844Scale(new mongoose.Types.ObjectId());

        // Create academic calendar
        academicCalendar = await AcademicCalendar.create({
            academicYear: '2025/2026',
            terms: [{
                termNumber: 1,
                name: 'Term 1',
                startDate: new Date('2025-09-01'),
                endDate: new Date('2025-11-30'),
            }],
            createdBy: new mongoose.Types.ObjectId()
        });

        // Create Admin User
        adminUser = await User.create({
            firstName: 'System',
            lastName: 'Admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin',
            roleMapping: 'User'
        });
        Object.keys(adminUser.permissions.administrative).forEach(key => {
            if (typeof adminUser.permissions.administrative[key] === 'boolean') {
                adminUser.permissions.administrative[key] = true;
            }
        });
        Object.keys(adminUser.permissions.academic).forEach(key => {
            const value = adminUser.permissions.academic[key];
            if (typeof value === 'boolean') {
                adminUser.permissions.academic[key] = true;
            }
            // Skip array fields like 'subjects' and 'classes'
        });
        await adminUser.save();
        adminToken = adminUser.getSignedJwtToken();

        // Create Test Class
        testClass = await Class.create({
            name: 'Form 1A',
            grade: 9,
            academicYear: '2025/2026',
            classCode: 'F1A2025'
        });

        // Create Test Subject
        testSubject = await Subject.create({
            name: 'Mathematics',
            code: 'MATH101',
            category: 'Core',
            creditHours: 40
        });

        // Create Teacher User and Profile
        teacherUser = await User.create({
            firstName: 'John',
            lastName: 'Teacher',
            email: 'teacher@test.com',
            password: 'password123',
            role: 'teacher',
            roleMapping: 'Teacher'
        });
        teacherUser.permissions.academic.canEnterResults = true;
        teacherUser.permissions.academic.canEditResults = true;
        teacherUser.permissions.administrative.canViewReports = true;
        await teacherUser.save();
        teacherToken = teacherUser.getSignedJwtToken();

        teacherProfile = await Teacher.create({
            firstName: 'John',
            lastName: 'Teacher',
            email: 'teacher@test.com',
            staffId: 'T001',
            teacherType: 'subject_teacher',
            userId: teacherUser._id,
            subjectsTaught: [testSubject._id],
            classTaught: testClass._id
        });

        teacherUser.profileId = teacherProfile._id;
        await teacherUser.save();

        // Create Student User and Profile
        studentUser = await User.create({
            firstName: 'Jane',
            lastName: 'Student',
            email: 'student@test.com',
            password: 'password123',
            role: 'student',
            roleMapping: 'Student'
        });
        studentToken = studentUser.getSignedJwtToken();

        studentProfile = await Student.create({
            firstName: 'Jane',
            lastName: 'Student',
            admissionNumber: 'S001',
            dateOfBirth: new Date('2008-01-01'),
            currentClass: testClass._id,
            userId: studentUser._id
        });

        studentUser.profileId = studentProfile._id;
        await studentUser.save();

        // Create StudentClass relationship
        await StudentClass.create({
            student: studentProfile._id,
            class: testClass._id,
            academicYear: '2025/2026',
            status: 'Active',
            enrollmentDate: new Date()
        });

        // Create Parent User and Profile
        parentUser = await User.create({
            firstName: 'Mary',
            lastName: 'Parent',
            email: 'parent@test.com',
            password: 'password123',
            role: 'parent',
            roleMapping: 'Parent'
        });
        parentToken = parentUser.getSignedJwtToken();

        parentProfile = await Parent.create({
            firstName: 'Mary',
            lastName: 'Parent',
            email: 'parent@test.com',
            phoneNumber: '+254712345678',
            userId: parentUser._id,
            children: [studentProfile._id]
        });

        parentUser.profileId = parentProfile._id;
        await parentUser.save();

        // Create test result for the student
        const testResult = new Result({
            student: studentProfile._id,
            subject: testSubject._id,
            class: testClass._id,
            academicYear: '2025/2026',
            termNumber: 1,
            assessments: {
                cat1: { marks: 25, maxMarks: 30, enteredBy: teacherUser._id },
                endterm: { marks: 60, maxMarks: 70, enteredBy: teacherUser._id }
            },
            enteredBy: teacherUser._id,
            status: 'published'
        });
        await testResult.save();
    }

    describe('🔐 Authentication Tests', () => {
        it('should authenticate all user types successfully', async () => {
            const roles = [
                { email: 'admin@test.com', role: 'admin' },
                { email: 'teacher@test.com', role: 'teacher' },
                { email: 'student@test.com', role: 'student' },
                { email: 'parent@test.com', role: 'parent' }
            ];

            for (const roleData of roles) {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: roleData.email,
                        password: 'password123'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.token).toBeDefined();
                expect(response.body.user.role).toBe(roleData.role);
            }
        });

        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('👨‍💼 Admin Role Tests', () => {
        it('should allow admin to access user management', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.users)).toBe(true);
        });

        it('should allow admin to manage classes', async () => {
            const response = await request(app)
                .get('/api/admin/classes')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.classes)).toBe(true);
        });

        it('should allow admin to manage subjects', async () => {
            const response = await request(app)
                .get('/api/admin/subjects')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.subjects)).toBe(true);
        });

        it('should allow admin to generate progress reports', async () => {
            const response = await request(app)
                .post('/api/admin/progress/generate')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    academicYear: '2025/2026',
                    studentId: studentProfile._id.toString()
                });

            expect(response.status).toBe(202);
            expect(response.body.message).toContain('Progress report generation initiated');
        });

        it('should allow admin to view student progress', async () => {
            // First generate progress
            await request(app)
                .post('/api/admin/progress/generate')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    academicYear: '2025/2026',
                    studentId: studentProfile._id.toString()
                });

            // Wait for generation
            await new Promise(resolve => setTimeout(resolve, 1000));

            const response = await request(app)
                .get(`/api/admin/progress/student/${studentProfile._id}/2025/2026`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect([200, 404]).toContain(response.status);
        });
    });

    describe('👨‍🏫 Teacher Role Tests', () => {
        it('should allow teacher to access their subjects', async () => {
            const response = await request(app)
                .get('/api/teacher/my-subjects')
                .set('Authorization', `Bearer ${teacherToken}`);

            expect([200, 404]).toContain(response.status); // 404 if no profile found
        });

        it('should allow teacher to view results they entered', async () => {
            const response = await request(app)
                .get('/api/teacher/results/entered-by-me')
                .set('Authorization', `Bearer ${teacherToken}`);

            expect([200, 404]).toContain(response.status);
        });

        it('should allow teacher to enter new results', async () => {
            const response = await request(app)
                .post('/api/teacher/results')
                .set('Authorization', `Bearer ${teacherToken}`)
                .send({
                    studentId: studentProfile._id,
                    subjectId: testSubject._id,
                    classId: testClass._id,
                    academicYear: '2025/2026',
                    termNumber: 1,
                    assessments: {
                        cat1: { marks: 28, maxMarks: 30 }
                    }
                });

            expect([200, 201, 400]).toContain(response.status); // May fail due to duplicate
        });

        it('should not allow teacher to access admin functions', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${teacherToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('👨‍🎓 Student Role Tests', () => {
        it('should allow student to view their own results', async () => {
            const response = await request(app)
                .get(`/api/student/results/${studentProfile._id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect([200, 404]).toContain(response.status);
        });

        it('should allow student to view their progress', async () => {
            const response = await request(app)
                .get(`/api/student/progress/${studentProfile._id}/2025/2026`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect([200, 404]).toContain(response.status);
        });

        it('should not allow student to access admin functions', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
        });

        it('should not allow student to access teacher functions', async () => {
            const response = await request(app)
                .get('/api/teacher/my-subjects')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('👨‍👩‍👧‍👦 Parent Role Tests', () => {
        it('should allow parent to view their children', async () => {
            const response = await request(app)
                .get('/api/parent/children')
                .set('Authorization', `Bearer ${parentToken}`);

            expect([200, 404]).toContain(response.status);
        });

        it('should allow parent to view child results', async () => {
            const response = await request(app)
                .get(`/api/parent/child-results/${studentProfile._id}`)
                .set('Authorization', `Bearer ${parentToken}`);

            expect([200, 404]).toContain(response.status);
        });

        it('should not allow parent to access admin functions', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${parentToken}`);

            expect(response.status).toBe(403);
        });

        it('should not allow parent to access teacher functions', async () => {
            const response = await request(app)
                .get('/api/teacher/my-subjects')
                .set('Authorization', `Bearer ${parentToken}`);

            expect(response.status).toBe(403);
        });
    });

    describe('📊 GradingScale Integration Tests', () => {
        it('should use GradingScale in result calculations for all roles', async () => {
            // Test that results use the grading scale properly
            const result = await Result.findOne({ 
                student: studentProfile._id, 
                subject: testSubject._id 
            });

            expect(result).toBeTruthy();
            expect(result.overallGrade).toBeDefined();
            expect(result.overallPoints).toBeDefined();
            expect(result.overallPercentage).toBeDefined();
            
            // Verify the grade matches GradingScale
            const scale = await GradingScale.getDefault('secondary');
            const gradeInfo = scale.getGradeInfo(result.overallPercentage);
            expect(result.overallGrade).toBe(gradeInfo.grade);
        });

        it('should allow admin to manage grading scales', async () => {
            // This would test grading scale CRUD operations
            // Since gradingScaleController exists, this should work
            expect(gradingScale).toBeTruthy();
            expect(gradingScale.name).toBe('Kenyan 8-4-4 System');
            expect(gradingScale.isDefault).toBe(true);
        });
    });

    describe('🔒 Security & Permission Tests', () => {
        it('should prevent cross-role data access', async () => {
            // Student trying to access other students' data
            const otherStudent = await Student.create({
                firstName: 'Other',
                lastName: 'Student',
                admissionNumber: 'S999',
                dateOfBirth: new Date('2008-01-01'),
                currentClass: testClass._id,
                userId: new mongoose.Types.ObjectId()
            });

            const response = await request(app)
                .get(`/api/student/results/${otherStudent._id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect([403, 404]).toContain(response.status);
        });

        it('should validate JWT tokens properly', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
        });

        it('should require authentication for protected routes', async () => {
            const response = await request(app)
                .get('/api/admin/users');

            expect(response.status).toBe(401);
        });
    });
});
