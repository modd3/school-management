const multer = require('multer');
const path = require('path');

// Set Storage Engine
// This configures Multer to store files on the local disk.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Specify the directory where uploaded files will be stored.
        // Make sure this directory exists in your project root!
        // You might want to create a 'uploads' folder.
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Define the filename for the uploaded file.
        // We're using the original fieldname + current timestamp + original file extension.
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Check File Type
// This function filters file types to allow only images.
const checkFileType = (file, cb) => {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
};

// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit (optional)
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

module.exports = upload;