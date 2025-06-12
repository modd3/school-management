const express = require('express');
const { uploadImage } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/authMiddleware'); // For authentication

const router = express.Router();

// You can add authorize middleware here if only specific roles can upload
router.post('/image', protect, authorize(['admin']), uploadImage);

module.exports = router;