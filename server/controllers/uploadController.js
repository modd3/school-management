const asyncHandler = require('express-async-handler');
const upload = require('../config/multerConfig'); // Import the multer setup

// @desc    Upload a single image file
// @route   POST /api/upload/image
// @access  Private (e.g., Teachers, Admins, Students for their own profile)
// You might want to protect this route based on who is uploading.
exports.uploadImage = asyncHandler(async (req, res) => {
    // 'profileImage' is the name of the field in the form.
    // If you expect other field names (e.g., 'teacherPhoto', 'studentPhoto'),
    // you might need multiple multer instances or a more generic approach.
    upload.single('profileImage')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // File uploaded successfully.
        // req.file will contain file information.
        // Construct the URL to access the image.
        // For local storage, it will be something like '/uploads/filename.jpg'
        const fileUrl = `/uploads/${req.file.filename}`; 
        
        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            filePath: fileUrl,
            fileName: req.file.filename,
            fileSize: req.file.size
        });
    });
});