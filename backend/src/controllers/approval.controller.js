const { asyncHandler } = require('../middleware/errorHandler');
const ApprovalService = require('../services/approvalService');

/**
 * @desc    Get pending approvals for manager
 * @route   GET /api/approvals/pending
 * @access  Private (Manager/Admin)
 */
const getPendingApprovals = asyncHandler(async (req, res) => {
  const managerId = req.user.id;
  const pendingApprovals = await ApprovalService.getPendingApprovals(managerId);

  res.status(200).json({
    success: true,
    data: pendingApprovals
  });
});

/**
 * @desc    Get team overview for manager
 * @route   GET /api/approvals/team-overview
 * @access  Private (Manager/Admin)
 */
const getTeamOverview = asyncHandler(async (req, res) => {
  const managerId = req.user.id;
  const { fiscalYear } = req.query;

  const overview = await ApprovalService.getTeamOverview(managerId, fiscalYear);

  res.status(200).json({
    success: true,
    data: overview
  });
});

/**
 * @desc    Approve goal sheet
 * @route   POST /api/approvals/:sheetId/approve
 * @access  Private (Manager/Admin)
 */
const approveGoalSheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const { comments, inlineEdits } = req.body;
  const managerId = req.user.id;

  const goalSheet = await ApprovalService.approveGoals(
    managerId,
    sheetId,
    comments
  );

  res.status(200).json({
    success: true,
    message: 'Goals approved successfully',
    data: goalSheet
  });
});

/**
 * @desc    Return goal sheet for rework
 * @route   POST /api/approvals/:sheetId/return
 * @access  Private (Manager/Admin)
 */
const returnGoalSheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const { comments } = req.body;
  const managerId = req.user.id;

  const goalSheet = await ApprovalService.returnForRework(
    managerId,
    sheetId,
    comments
  );

  res.status(200).json({
    success: true,
    message: 'Goals returned for rework',
    data: goalSheet
  });
});

/**
 * @desc    Apply inline edits to goals
 * @route   PUT /api/approvals/:sheetId/inline-edit
 * @access  Private (Manager/Admin)
 */
const applyInlineEdits = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const { edits } = req.body;
  const managerId = req.user.id;

  const updatedGoals = await ApprovalService.applyInlineEdits(
    sheetId,
    edits,
    managerId
  );

  res.status(200).json({
    success: true,
    message: 'Inline edits applied successfully',
    data: updatedGoals
  });
});

/**
 * @desc    Get approval history for a goal sheet
 * @route   GET /api/approvals/:sheetId/history
 * @access  Private
 */
const getApprovalHistory = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  
  // This would need to query audit logs
  const history = [];

  res.status(200).json({
    success: true,
    data: history
  });
});

/**
 * @desc    Get goal sheet details for approval
 * @route   GET /api/approvals/:sheetId
 * @access  Private (Manager/Admin)
 */
const getGoalSheetForApproval = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const managerId = req.user.id;

  const goalSheet = await ApprovalService.getGoalSheetForApproval(
    sheetId,
    managerId
  );

  res.status(200).json({
    success: true,
    data: goalSheet
  });
});

/**
 * @desc    Bulk approve multiple goal sheets
 * @route   POST /api/approvals/bulk-approve
 * @access  Private (Manager/Admin)
 */
const bulkApprove = asyncHandler(async (req, res) => {
  const { sheetIds, comments } = req.body;
  const managerId = req.user.id;

  const results = [];
  for (const sheetId of sheetIds) {
    try {
      const goalSheet = await ApprovalService.approveGoals(
        sheetId,
        managerId,
        comments
      );
      results.push({ sheetId, success: true, data: goalSheet });
    } catch (error) {
      results.push({ sheetId, success: false, error: error.message });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Bulk approval completed',
    data: results
  });
});

/**
 * @desc    Get approval statistics
 * @route   GET /api/approvals/stats
 * @access  Private (Manager/Admin)
 */
const getApprovalStats = asyncHandler(async (req, res) => {
  const managerId = req.user.id;
  const { fiscalYear } = req.query;

  const stats = {
    pending: 0,
    approved: 0,
    returned: 0,
    total: 0
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getPendingApprovals,
  getTeamOverview,
  approveGoalSheet,
  returnGoalSheet,
  applyInlineEdits,
  getApprovalHistory,
  getGoalSheetForApproval,
  bulkApprove,
  getApprovalStats
};
