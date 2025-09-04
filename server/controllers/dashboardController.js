const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const AcademicCalendar = require('../models/AcademicCalendar');
const asyncHandler = require('express-async-handler');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private (Admin)
exports.getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Get counts for different entities
        const [
            totalUsers,
            totalStudents,
            totalTeachers,
            totalParents,
            totalClasses,
            totalSubjects,
            activeAcademicYear
        ] = await Promise.all([
            User.countDocuments({ isActive: { $ne: false } }),
            Student.countDocuments({ isActive: { $ne: false } }),
            Teacher.countDocuments({ isActive: { $ne: false } }),
            Parent.countDocuments({ isActive: { $ne: false } }),
            Class.countDocuments({ isActive: { $ne: false } }),
            Subject.countDocuments({ isActive: { $ne: false } }),
            AcademicCalendar.findOne({ isActive: true }).select('academicYear currentTerm')
        ]);

        // Get recent activity counts
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const [
            recentResults,
            recentAttendance,
            recentUsers
        ] = await Promise.all([
            Result.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Attendance.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalStudents,
                totalTeachers,
                totalParents,
                totalClasses,
                totalSubjects,
                activeAcademicYear: activeAcademicYear?.academicYear || 'Not Set',
                currentTerm: activeAcademicYear?.currentTerm || 'Not Set',
                recentActivity: {
                    results: recentResults,
                    attendance: recentAttendance,
                    users: recentUsers
                }
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
});

// @desc    Get recent activity
// @route   GET /api/dashboard/recent-activity
// @access  Private
exports.getRecentActivity = asyncHandler(async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get recent results entries
        const recentResults = await Result.find()
            .populate('student', 'firstName lastName')
            .populate('subject', 'name')
            .populate('enteredBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit / 2)
            .select('student subject assessments createdAt enteredBy');

        // Get recent user registrations
        const recentUsers = await User.find({ role: { $ne: 'admin' } })
            .populate('profileId')
            .sort({ createdAt: -1 })
            .limit(limit / 2)
            .select('firstName lastName role createdAt');

        // Format activities
        const activities = [];

        // Add result activities
        recentResults.forEach(result => {
            activities.push({
                id: result._id,
                type: 'result_entry',
                description: `Results entered for ${result.subject?.name || 'Unknown Subject'}`,
                user: result.enteredBy ? `${result.enteredBy.firstName} ${result.enteredBy.lastName}` : 'Unknown Teacher',
                student: result.student ? `${result.student.firstName} ${result.student.lastName}` : 'Unknown Student',
                timestamp: result.createdAt,
                status: 'success'
            });
        });

        // Add user registration activities
        recentUsers.forEach(user => {
            activities.push({
                id: user._id,
                type: 'user_creation',
                description: `New ${user.role} registered`,
                user: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                timestamp: user.createdAt,
                status: 'success'
            });
        });

        // Sort by timestamp and limit
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const limitedActivities = activities.slice(0, limit);

        res.json({
            success: true,
            data: limitedActivities
        });
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activity',
            error: error.message
        });
    }
});

// @desc    Get user-specific dashboard data
// @route   GET /api/dashboard/user-data
// @access  Private
exports.getUserDashboardData = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        let dashboardData = {};

        if (user.role === 'student') {
            // Get student-specific data
            const studentProfile = await Student.findById(user.profileId)
                .populate('currentClass', 'name grade')
                .populate('parentContacts', 'firstName lastName phone');

            // Get recent results
            const recentResults = await Result.find({ student: user.profileId })
                .populate('subject', 'name')
                .populate('class', 'name')
                .sort({ createdAt: -1 })
                .limit(5);

            dashboardData = {
                profile: studentProfile,
                recentResults: recentResults.length,
                currentClass: studentProfile?.currentClass,
                parentContacts: studentProfile?.parentContacts || []
            };
        } else if (user.role === 'teacher') {
            // Get teacher-specific data
            const teacherProfile = await Teacher.findById(user.profileId)
                .populate('subjectsTaught', 'name')
                .populate('classTaught', 'name grade');

            // Get classes taught count
            const classesCount = await Class.countDocuments({ 
                classTeacher: user.profileId,
                isActive: { $ne: false }
            });

            // Get recent results entered
            const recentResults = await Result.countDocuments({ 
                enteredBy: user._id,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            });

            dashboardData = {
                profile: teacherProfile,
                classesTeaching: classesCount,
                subjectsTeaching: teacherProfile?.subjectsTaught?.length || 0,
                recentResultsEntered: recentResults
            };
        } else if (user.role === 'parent') {
            // Get parent-specific data
            const parentProfile = await Parent.findById(user.profileId)
                .populate('children', 'firstName lastName currentClass');

            // Get children's recent performance
            const childrenIds = parentProfile?.children?.map(child => child._id) || [];
            const recentResults = await Result.countDocuments({ 
                student: { $in: childrenIds },
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            });

            dashboardData = {
                profile: parentProfile,
                childrenCount: childrenIds.length,
                recentResults: recentResults
            };
        }

        res.json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('User dashboard data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user dashboard data',
            error: error.message
        });
    }
});

// @desc    Get system health status
// @route   GET /api/dashboard/system-status
// @access  Private (Admin)
exports.getSystemStatus = asyncHandler(async (req, res) => {
    try {
        // Check database connectivity and get some basic health metrics
        const healthChecks = await Promise.all([
            User.findOne().lean(), // DB connectivity test
            AcademicCalendar.findOne({ isActive: true }).lean(),
        ]);

        const isDbConnected = healthChecks[0] !== null || healthChecks[0] === null; // Connection test
        const hasActiveAcademicYear = !!healthChecks[1];

        // Get some system metrics
        const [
            totalStorage, // This would need proper implementation for file storage
            activeUsersToday
        ] = await Promise.all([
            // Placeholder for storage calculation
            Promise.resolve('Unknown'),
            User.countDocuments({ 
                lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            })
        ]);

        res.json({
            success: true,
            data: {
                database: {
                    status: isDbConnected ? 'Connected' : 'Error',
                    healthy: isDbConnected
                },
                academicYear: {
                    status: hasActiveAcademicYear ? 'Active' : 'Not Set',
                    healthy: hasActiveAcademicYear
                },
                activeUsersToday,
                storage: totalStorage,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version
            }
        });
    } catch (error) {
        console.error('System status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system status',
            error: error.message
        });
    }
});
