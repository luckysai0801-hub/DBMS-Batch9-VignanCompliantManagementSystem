// =============================================
// middleware/uploadMiddleware.js
// Handles file uploads using multer
// =============================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Make sure uploads folder exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage settings
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files to public/uploads/
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp + original name
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'complaint-' + uniqueName + ext);
    }
});

// Filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true); // Accept file
    } else {
        cb(new Error('Only image files are allowed! (jpeg, jpg, png, gif, webp)'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

module.exports = upload;
