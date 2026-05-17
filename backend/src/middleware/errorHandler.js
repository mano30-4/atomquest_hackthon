const logger = require('../utils/logger');
const config = require('../config');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Default to 500 if no status code
  statusCode = statusCode || 500;

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode
    });
  }

  // Prepare error response
  const response = {
    success: false,
    statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack })
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    response.statusCode = 400;
    response.message = 'Validation Error';
    response.errors = err.details || err.errors;
  }

  if (err.name === 'SequelizeValidationError') {
    response.statusCode = 400;
    response.message = 'Database Validation Error';
    response.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    response.statusCode = 409;
    response.message = 'Duplicate Entry';
    response.errors = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} already exists`
    }));
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    response.statusCode = 400;
    response.message = 'Invalid Reference';
  }

  if (err.name === 'JsonWebTokenError') {
    response.statusCode = 401;
    response.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    response.statusCode = 401;
    response.message = 'Token expired';
  }

  res.status(response.statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ApiError,
  errorHandler,
  notFound,
  asyncHandler
};
