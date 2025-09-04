const express = require('express');
const { 
    getDashboardStats, 
    getRecentActivity, 
    getUserDashboardData,
    getSystemStatus
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Dashboard statistics (Admin only)
router.get('/stats', authorize('admin'), getDashboardStats);

// Recent activity (All authenticated users)
router.get('/recent-activity', getRecentActivity);

// User-specific dashboard data (All authenticated users)
router.get('/user-data', getUserDashboardData);

// System health status (Admin only)
router.get('/system-status', authorize('admin'), getSystemStatus);

module.exports = router;
