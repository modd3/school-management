// routes/principalRoutes.js (New route for principal-specific actions)
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { updatePrincipalComment } = require('../controllers/reportCardController');

router.use(protect);
router.use(authorize(['principal', 'admin'])); // Principal and Admin can access

router.put('/reportcard/principal-comment/:reportCardId', updatePrincipalComment);

module.exports = router;
