const { asyncHandler } = require('../middleware/errorHandler');
const CheckinService = require('../services/checkinService');

/**
 * @desc    Create a check-in
 * @route   POST /api/checkins
 * @access  Private
 */
const createCheckin = asyncHandler(async (req, res) => {
  const { goalId, quarter, achievement, comments, status } = req.body;
  const employeeId = req.user.id;

  const checkin = await CheckinService.createCheckin(
    goalId,
    quarter,
    achievement,
    comments,
    employeeId,
    status
  );

  res.status(201).json({
    success: true,
    message: 'Check-in created successfully',
    data: checkin
  });
});

/**
 * @desc    Update a check-in
 * @route   PUT /api/checkins/:id
 * @access  Private
 */
const updateCheckin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { achievement, comments, status } = req.body;

  const checkin = await CheckinService.updateCheckin(id, achievement, comments, status);

  res.status(200).json({
    success: true,
    message: 'Check-in updated successfully',
    data: checkin
  });
});

/**
 * @desc    Get check-in by ID
 * @route   GET /api/checkins/:id
 * @access  Private
 */
const getCheckin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const checkin = await CheckinService.getCheckinById(id);

  res.status(200).json({
    success: true,
    data: checkin
  });
});

/**
 * @desc    Get check-ins for a goal
 * @route   GET /api/checkins/goal/:goalId
 * @access  Private
 */
const getCheckinsByGoal = asyncHandler(async (req, res) => {
  const { goalId } = req.params;
  const checkins = await CheckinService.getCheckinsByGoal(goalId);

  res.status(200).json({
    success: true,
    data: checkins
  });
});

/**
 * @desc    Get check-ins for a quarter
 * @route   GET /api/checkins/quarter/:quarter
 * @access  Private
 */
const getCheckinsByQuarter = asyncHandler(async (req, res) => {
  const { quarter } = req.params;
  const employeeId = req.user.id;

  const checkins = await CheckinService.getCheckinsByQuarter(employeeId, quarter);

  res.status(200).json({
    success: true,
    data: checkins
  });
});

/**
 * @desc    Add manager comment to check-in
 * @route   POST /api/checkins/:id/comment
 * @access  Private (Manager/Admin)
 */
const addManagerComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const managerId = req.user.id;

  const commentRecord = await CheckinService.addManagerComment(
    id,
    managerId,
    comment
  );

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: commentRecord
  });
});

/**
 * @desc    Get comments for a check-in
 * @route   GET /api/checkins/:id/comments
 * @access  Private
 */
const getCheckinComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comments = await CheckinService.getCheckinComments(id);

  res.status(200).json({
    success: true,
    data: comments
  });
});

/**
 * @desc    Get completion dashboard
 * @route   GET /api/checkins/dashboard/completion
 * @access  Private (Manager/Admin)
 */
const getCompletionDashboard = asyncHandler(async (req, res) => {
  const { quarter, fiscalYear } = req.query;
  const dashboard = await CheckinService.getCompletionDashboard(
    quarter,
    fiscalYear
  );

  res.status(200).json({
    success: true,
    data: dashboard
  });
});

/**
 * @desc    Check if check-in window is open
 * @route   GET /api/checkins/window/:quarter
 * @access  Private
 */
const checkCheckinWindow = asyncHandler(async (req, res) => {
  const { quarter } = req.params;
  const isOpen = CheckinService.isCheckinWindowOpen(quarter);

  res.status(200).json({
    success: true,
    data: {
      quarter,
      isOpen,
      message: isOpen 
        ? `Check-in window for ${quarter} is currently open`
        : `Check-in window for ${quarter} is closed`
    }
  });
});

/**
 * @desc    Get employee check-in status
 * @route   GET /api/checkins/status/:employeeId
 * @access  Private
 */
const getEmployeeCheckinStatus = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { quarter, fiscalYear } = req.query;

  // This would need a new service method to get status
  const status = {
    totalGoals: 0,
    completedCheckins: 0,
    pendingCheckins: 0,
    completionPercentage: 0
  };

  res.status(200).json({
    success: true,
    data: status
  });
});

/**
 * @desc    Get team check-in summary
 * @route   GET /api/checkins/team/summary
 * @access  Private (Manager/Admin)
 */
const getTeamCheckinSummary = asyncHandler(async (req, res) => {
  const { quarter, fiscalYear } = req.query;

  const summary = await CheckinService.getCompletionDashboard(
    quarter,
    fiscalYear
  );

  res.status(200).json({
    success: true,
    data: summary
  });
});

/**
 * @desc    Bulk create check-ins
 * @route   POST /api/checkins/bulk
 * @access  Private
 */
const bulkCreateCheckins = asyncHandler(async (req, res) => {
  const { checkins } = req.body;
  const employeeId = req.user.id;

  const results = [];
  for (const checkinData of checkins) {
    try {
      const checkin = await CheckinService.createCheckin(
        checkinData.goalId,
        checkinData.quarter,
        checkinData.achievement,
        checkinData.comments,
        employeeId
      );
      results.push({ goalId: checkinData.goalId, success: true, data: checkin });
    } catch (error) {
      results.push({ goalId: checkinData.goalId, success: false, error: error.message });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Bulk check-in creation completed',
    data: results
  });
});

module.exports = {
  createCheckin,
  updateCheckin,
  getCheckin,
  getCheckinsByGoal,
  getCheckinsByQuarter,
  addManagerComment,
  getCheckinComments,
  getCompletionDashboard,
  checkCheckinWindow,
  getEmployeeCheckinStatus,
  getTeamCheckinSummary,
  bulkCreateCheckins
};
