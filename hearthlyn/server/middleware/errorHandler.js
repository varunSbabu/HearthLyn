const { sendResponse } = require('../utils/sendResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('❌ Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    return sendResponse(res, 404, false, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = 'Email already exists';
    } else if (field === 'phone') {
      message = 'Phone number already exists';
    }
    
    return sendResponse(res, 400, false, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return sendResponse(res, 400, false, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return sendResponse(res, 401, false, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return sendResponse(res, 401, false, message);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    return sendResponse(res, 400, false, message);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    return sendResponse(res, 400, false, message);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    return sendResponse(res, 400, false, message);
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError') {
    const message = 'Database connection error';
    return sendResponse(res, 503, false, message);
  }

  if (err.name === 'MongoTimeoutError') {
    const message = 'Database timeout error';
    return sendResponse(res, 503, false, message);
  }

  // Custom API errors
  if (err.isOperational) {
    return sendResponse(res, err.statusCode || 500, false, err.message);
  }

  // Default error
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message || 'Server Error';

  const statusCode = err.statusCode || 500;

  // Don't leak error details in production
  const errorDetails = process.env.NODE_ENV === 'production' 
    ? undefined 
    : {
        stack: err.stack,
        name: err.name,
        code: err.code
      };

  return sendResponse(res, statusCode, false, message, null, errorDetails);
};

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  AppError,
  asyncHandler,
  notFound
};