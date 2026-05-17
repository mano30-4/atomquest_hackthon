const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

/**
 * @route   GET /api/approvals/pending
 * @desc    Get pending approvals for manager
 * @access  Private (Manager/Admin)
 */
router.get(
  '/pending',
  authenticate,
  authorize('manager', 'admin'),
  approvalController.getPendingApprovals
);

/**
 * @route   GET /api/approvals/team-overview
 * @desc    Get team overview for manager
 * @access  Private (Manager/Admin)
 */
router.get(
  '/team-overview',
  authenticate,
  authorize('manager', 'admin'),
  approvalController.getTeamOverview
);

/**
 * @route   GET /api/approvals/:sheetId
 * @desc    Get goal sheet details for approval
 * @access  Private (Manager/Admin)
 */
router.get(
  '/stats',
  authenticate,
  authorize('manager', 'admin'),
  approvalController.getApprovalStats
);

/**
 * @route   POST /api/approvals/bulk-approve
 * @desc    Bulk approve multiple goal sheets
 * @access  Private (Manager/Admin)
 */
router.post(
  '/bulk-approve',
  authenticate,
  authorize('manager', 'admin'),
  approvalController.bulkApprove
);

router.get(
  '/:sheetId',
  authenticate,
  authorize('manager', 'admin'),
  validate(schemas.id, 'params'),
  approvalController.getGoalSheetForApproval
);

/**
 * @route   POST /api/approvals/:sheetId/approve
 * @desc    Approve goal sheet
 * @access  Private (Manager/Admin)
 */
router.post(
  '/:sheetId/approve',
  authenticate,
  authorize('manager', 'admin'),
  validate(schemas.id, 'params'),
  approvalController.approveGoalSheet
);

/**
 * @route   POST /api/approvals/:sheetId/return
 * @desc    Return goal sheet for rework
 * @access  Private (Manager/Admin)
 */
router.post(
  '/:sheetId/return',
  authenticate,
  authorize('manager', 'admin'),
  validate(schemas.id, 'params'),
  approvalController.returnGoalSheet
);

/**
 * @route   PUT /api/approvals/:sheetId/inline-edit
 * @desc    Apply inline edits to goals
 * @access  Private (Manager/Admin)
 */
router.put(
  '/:sheetId/inline-edit',
  authenticate,
  authorize('manager', 'admin'),
  validate(schemas.id, 'params'),
  approvalController.applyInlineEdits
);

/**
 * @route   GET /api/approvals/:sheetId/history
 * @desc    Get approval history for a goal sheet
 * @access  Private
 */
router.get(
  '/:sheetId/history',
  authenticate,
  validate(schemas.id, 'params'),
  approvalController.getApprovalHistory
);

module.exports = router;
