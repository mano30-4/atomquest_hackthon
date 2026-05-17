const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkin.controller');
const { authenticate, authorize, authorizeOwnerOrManager } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

/**
 * @route   POST /api/checkins
 * @desc    Create a check-in
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(schemas.createCheckin),
  checkinController.createCheckin
);

/**
 * @route   POST /api/checkins/bulk
 * @desc    Bulk create check-ins
 * @access  Private
 */
router.post(
  '/bulk',
  authenticate,
  checkinController.bulkCreateCheckins
);

router.get(
  '/goal/:goalId',
  authenticate,
  checkinController.getCheckinsByGoal
);

router.get(
  '/quarter/:quarter',
  authenticate,
  checkinController.getCheckinsByQuarter
);

router.get(
  '/dashboard/completion',
  authenticate,
  authorize('manager', 'admin'),
  checkinController.getCompletionDashboard
);

router.get(
  '/window/:quarter',
  authenticate,
  checkinController.checkCheckinWindow
);

router.get(
  '/status/:employeeId',
  authenticate,
  authorizeOwnerOrManager('employeeId'),
  checkinController.getEmployeeCheckinStatus
);

router.get(
  '/team/summary',
  authenticate,
  authorize('manager', 'admin'),
  checkinController.getTeamCheckinSummary
);

/**
 * @route   GET /api/checkins/:id
 * @desc    Get check-in by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate(schemas.id, 'params'),
  checkinController.getCheckin
);

/**
 * @route   PUT /api/checkins/:id
 * @desc    Update a check-in
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate(schemas.id, 'params'),
  checkinController.updateCheckin
);

/**
 * @route   GET /api/checkins/goal/:goalId
 * @desc    Get check-ins for a goal
 * @access  Private
 */
router.get(
  '/goal/:goalId',
  authenticate,
  checkinController.getCheckinsByGoal
);

/**
 * @route   GET /api/checkins/quarter/:quarter
 * @desc    Get check-ins for a quarter
 * @access  Private
 */
router.get(
  '/quarter/:quarter',
  authenticate,
  checkinController.getCheckinsByQuarter
);

/**
 * @route   POST /api/checkins/:id/comment
 * @desc    Add manager comment to check-in
 * @access  Private (Manager/Admin)
 */
router.post(
  '/:id/comment',
  authenticate,
  authorize('manager', 'admin'),
  validate(schemas.id, 'params'),
  validate(schemas.checkinComment),
  checkinController.addManagerComment
);

/**
 * @route   GET /api/checkins/:id/comments
 * @desc    Get comments for a check-in
 * @access  Private
 */
router.get(
  '/:id/comments',
  authenticate,
  validate(schemas.id, 'params'),
  checkinController.getCheckinComments
);

/**
 * @route   GET /api/checkins/dashboard/completion
 * @desc    Get completion dashboard
 * @access  Private (Manager/Admin)
 */
router.get(
  '/dashboard/completion',
  authenticate,
  authorize('manager', 'admin'),
  checkinController.getCompletionDashboard
);

/**
 * @route   GET /api/checkins/window/:quarter
 * @desc    Check if check-in window is open
 * @access  Private
 */
router.get(
  '/window/:quarter',
  authenticate,
  checkinController.checkCheckinWindow
);

/**
 * @route   GET /api/checkins/status/:employeeId
 * @desc    Get employee check-in status
 * @access  Private
 */
router.get(
  '/status/:employeeId',
  authenticate,
  authorizeOwnerOrManager('employeeId'),
  checkinController.getEmployeeCheckinStatus
);

/**
 * @route   GET /api/checkins/team/summary
 * @desc    Get team check-in summary
 * @access  Private (Manager/Admin)
 */
router.get(
  '/team/summary',
  authenticate,
  authorize('manager', 'admin'),
  checkinController.getTeamCheckinSummary
);

module.exports = router;
