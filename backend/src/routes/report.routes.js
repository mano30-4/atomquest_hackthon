const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

/**
 * @route   GET /api/reports/achievement
 * @desc    Get achievement report
 * @access  Private (Manager/Admin)
 */
router.get(
  '/achievement',
  authenticate,
  authorize('manager', 'admin'),
  validate(schemas.reportFilters, 'query'),
  reportController.getAchievementReport
);

/**
 * @route   GET /api/reports/completion
 * @desc    Get completion dashboard
 * @access  Private (Manager/Admin)
 */
router.get(
  '/completion',
  authenticate,
  authorize('manager', 'admin'),
  validate(schemas.reportFilters, 'query'),
  reportController.getCompletionDashboard
);

/**
 * @route   GET /api/reports/audit-logs
 * @desc    Get audit logs
 * @access  Private (Admin)
 */
router.get(
  '/audit-logs',
  authenticate,
  authorize('admin'),
  validate(schemas.pagination, 'query'),
  reportController.getAuditLogs
);

/**
 * @route   GET /api/reports/export/achievement
 * @desc    Export achievement report to CSV
 * @access  Private (Manager/Admin)
 */
router.get(
  '/export/achievement',
  authenticate,
  authorize('manager', 'admin'),
  reportController.exportAchievementCSV
);

/**
 * @route   GET /api/reports/export/completion
 * @desc    Export completion report to Excel
 * @access  Private (Manager/Admin)
 */
router.get(
  '/export/completion',
  authenticate,
  authorize('manager', 'admin'),
  reportController.exportCompletionExcel
);

/**
 * @route   GET /api/reports/stats/goals
 * @desc    Get goal statistics
 * @access  Private (Manager/Admin)
 */
router.get(
  '/stats/goals',
  authenticate,
  authorize('manager', 'admin'),
  reportController.getGoalStatistics
);

/**
 * @route   GET /api/reports/stats/thrust-areas
 * @desc    Get thrust area distribution
 * @access  Private (Manager/Admin)
 */
router.get(
  '/stats/thrust-areas',
  authenticate,
  authorize('manager', 'admin'),
  reportController.getThrustAreaDistribution
);

module.exports = router;
