const jwt = require('jsonwebtoken');
const { ApiError, asyncHandler } = require('./errorHandler');
const config = require('../config');
const { User } = require('../models');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = asyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'No token provided. Please authenticate.');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get user from database
    const user = await User.findByPk(decoded.userId || decoded.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      throw new ApiError(401, 'User not found. Token is invalid.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'User account is inactive.');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired. Please login again.');
    }
    throw error;
  }
});

/**
 * Check if user has required role(s)
 * @param {string|string[]} roles - Required role(s)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const hasRole = roles.includes(req.user.role);
    
    if (!hasRole) {
      throw new ApiError(
        403,
        `Access denied. Required role(s): ${roles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Check if user is accessing their own resource or is a manager/admin
 * @param {string} paramName - Name of the parameter containing user ID
 */
const authorizeOwnerOrManager = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const resourceUserId = parseInt(req.params[paramName]);
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Allow if user is accessing their own resource
    if (resourceUserId === currentUserId) {
      return next();
    }

    // Allow if user is manager or admin
    if (userRole === 'manager' || userRole === 'admin') {
      return next();
    }

    throw new ApiError(403, 'Access denied. You can only access your own resources.');
  };
};

/**
 * Check if user is a manager of the specified employee
 */
const authorizeManager = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const employeeId = parseInt(req.params.employeeId || req.body.employeeId);
  
  if (!employeeId) {
    throw new ApiError(400, 'Employee ID is required');
  }

  // Admin can access all
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if current user is the manager
  if (req.user.role === 'manager') {
    const employee = await User.findByPk(employeeId);
    
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    if (employee.managerId !== req.user.id) {
      throw new ApiError(403, 'You are not the manager of this employee');
    }

    return next();
  }

  throw new ApiError(403, 'Access denied. Manager role required.');
});

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.userId || decoded.id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
});

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrManager,
  authorizeManager,
  optionalAuth
};
