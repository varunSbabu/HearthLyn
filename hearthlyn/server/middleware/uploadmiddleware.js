const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create subdirectories
const subDirs = ['profiles', 'documents', 'services'];
subDirs.forEach(dir => {
  const subDir = path.join(uploadDir, dir);
  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    // Determine folder based on field name
    if (file.fieldname.includes('profile')) {
      folder += 'profiles/';
    } else if (file.fieldname.includes('document') || file.fieldname.includes('aadhar') || file.fieldname.includes('pan')) {
      folder += 'documents/';
    } else if (file.fieldname.includes('service') || file.fieldname.includes('certificate')) {
      folder += 'services/';
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, name);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type based on fieldname
  if (file.fieldname.includes('profile')) {
    // Profile images: only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Profile picture must be an image file', 400), false);
    }
  } else if (file.fieldname.includes('document')) {
    // Documents: images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Documents must be image or PDF files', 400), false);
    }
  } else if (file.fieldname.includes('certificate')) {
    // Certificates: images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Certificates must be image or PDF files', 400), false);
    }
  } else {
    // Default: only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400), false);
    }
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

// Different upload configurations
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// Predefined upload configurations
const uploadProfile = uploadSingle('profileImage');
const uploadDocuments = uploadFields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'certificates', maxCount: 5 }
]);

const uploadServiceImages = uploadMultiple('serviceImages', 3);

// Middleware to handle file upload errors
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File too large. Maximum size is 5MB', 400));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files uploaded', 400));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected file field', 400));
    }
  }
  next(error);
};

// Middleware to clean up uploaded files on error
const cleanupFiles = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  const cleanup = () => {
    if (res.statusCode >= 400 && req.files) {
      // Delete uploaded files if request failed
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
  };

  res.send = function(data) {
    cleanup();
    originalSend.call(this, data);
  };

  res.json = function(data) {
    cleanup();
    originalJson.call(this, data);
  };

  next();
};

// Utility function to delete file
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Get file URL
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${filePath}`;
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadProfile,
  uploadDocuments,
  uploadServiceImages,
  handleUploadError,
  cleanupFiles,
  deleteFile,
  getFileUrl
};