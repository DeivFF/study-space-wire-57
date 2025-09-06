import multer from 'multer';
import { AppError } from '../utils/studyValidation.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = {
    'application/pdf': 'pdf',
    'audio/mpeg': 'audio',
    'audio/mp3': 'audio', 
    'audio/wav': 'audio',
    'audio/m4a': 'audio',
    'audio/aac': 'audio',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/gif': 'image',
    'image/webp': 'image'
  };

  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new AppError(`File type not supported: ${file.mimetype}`, 400), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10 // Max 10 files per upload
  }
});

// Middleware for multiple file uploads
export const uploadMultiple = upload.array('files', 10);

// Middleware for single file upload
export const uploadSingle = upload.single('file');

// Error handler for multer errors
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'File too large',
          code: 'FILE_TOO_LARGE'
        }
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Too many files',
          code: 'TOO_MANY_FILES'
        }
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Unexpected file field',
          code: 'UNEXPECTED_FILE'
        }
      });
    }
  }
  
  if (error && error.message && error.message.includes('File type not supported')) {
    return res.status(400).json({
      success: false,
      error: {
        message: error.message,
        code: 'UNSUPPORTED_FILE_TYPE'
      }
    });
  }

  // Pass to next error handler if not multer error
  next(error);
};