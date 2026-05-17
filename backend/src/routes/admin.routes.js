const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User Management Routes

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin)
 */
router.get(
  '/users',
  validate(schemas.pagination, 'query'),
  adminController.getAllUsers
);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin)
 */
router.get(
  '/users/:id',
  validate(schemas.id, 'params'),
  adminController.getUserById
);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Private (Admin)
 */
router.post(
  '/users',
  validate(schemas.register),
  adminController.createUser
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.put(
  '/users/:id',
  validate(schemas.id, 'params'),
  adminController.updateUser
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin)
 */
router.delete(
  '/users/:id',
  validate(schemas.id, 'params'),
  adminController.deleteUser
);

/**
 * @route   POST /api/admin/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin)
 */
router.post(
  '/users/:id/reset-password',
  validate(schemas.id, 'params'),
  adminController.resetUserPassword
);

/**
 * @route   POST /api/admin/users/bulk-import
 * @desc    Bulk import users
 * @access  Private (Admin)
 */
router.post(
  '/users/bulk-import',
  adminController.bulkImportUsers
);

// Thrust Area Management Routes

/**
 * @route   GET /api/admin/thrust-areas
 * @desc    Get all thrust areas
 * @access  Private (Admin)
 */
router.get(
  '/thrust-areas',
  adminController.getAllThrustAreas
);

/**
 * @route   POST /api/admin/thrust-areas
 * @desc    Create thrust area
 * @access  Private (Admin)
 */
router.post(
  '/thrust-areas',
  validate(schemas.thrustArea),
  adminController.createThrustArea
);

/**
 * @route   PUT /api/admin/thrust-areas/:id
 * @desc    Update thrust area
 * @access  Private (Admin)
 */
router.put(
  '/thrust-areas/:id',
  validate(schemas.id, 'params'),
  validate(schemas.thrustArea),
  adminController.updateThrustArea
);

/**
 * @route   DELETE /api/admin/thrust-areas/:id
 * @desc    Delete thrust area
 * @access  Private (Admin)
 */
router.delete(
  '/thrust-areas/:id',
  validate(schemas.id, 'params'),
  adminController.deleteThrustArea
);

// System Management Routes

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  adminController.getSystemStats
);

router.get(
  '/settings',
  adminController.getFiscalYearConfig
);

router.put(
  '/settings',
  adminController.getFiscalYearConfig
);

/**
 * @route   GET /api/admin/fiscal-year
 * @desc    Get fiscal year configuration
 * @access  Private (Admin)
 */
router.get(
  '/fiscal-year',
  adminController.getFiscalYearConfig
);

/**
 * @route   POST /api/admin/lock-goal-sheets
 * @desc    Lock goal sheets for a fiscal year
 * @access  Private (Admin)
 */
router.post(
  '/lock-goal-sheets',
  adminController.lockGoalSheets
);

/**
 * @route   GET /api/admin/audit-summary
 * @desc    Get audit log summary
 * @access  Private (Admin)
 */
router.get(
  '/audit-summary',
  validate(schemas.dateRange, 'query'),
  adminController.getAuditSummary
);

module.exports = router;
