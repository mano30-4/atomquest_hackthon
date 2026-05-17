const { asyncHandler } = require('../middleware/errorHandler');
const GoalService = require('../services/goalService');
const { ThrustArea } = require('../models');

/**
 * @desc    Create a new goal sheet
 * @route   POST /api/goals/sheets
 * @access  Private
 */
const createGoalSheet = asyncHandler(async (req, res) => {
  const { fiscalYear } = req.body;
  const employeeId = req.user.id;

  const goalSheet = await GoalService.createGoalSheet(employeeId, fiscalYear);

  res.status(201).json({
    success: true,
    message: 'Goal sheet created successfully',
    data: goalSheet
  });
});

/**
 * @desc    Get goal sheet by ID
 * @route   GET /api/goals/sheets/:id
 * @access  Private
 */
const getGoalSheet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goalSheet = await GoalService.getGoalSheetById(id);

  res.status(200).json({
    success: true,
    data: goalSheet
  });
});

/**
 * @desc    Get user's goal sheets
 * @route   GET /api/goals/sheets/user/:userId
 * @access  Private
 */
const getUserGoalSheets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const goalSheets = await GoalService.getGoalSheetsByEmployee(userId);

  res.status(200).json({
    success: true,
    data: goalSheets
  });
});

/**
 * @desc    Create a new goal
 * @route   POST /api/goals
 * @access  Private
 */
const createGoal = asyncHandler(async (req, res) => {
  const goalData = req.body;
  const goal = await GoalService.createGoal(goalData, req.user.id);

  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: goal
  });
});

/**
 * @desc    Update a goal
 * @route   PUT /api/goals/:id
 * @access  Private
 */
const updateGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const goal = await GoalService.updateGoal(id, updates, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Goal updated successfully',
    data: goal
  });
});

/**
 * @desc    Delete a goal
 * @route   DELETE /api/goals/:id
 * @access  Private
 */
const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await GoalService.deleteGoal(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Goal deleted successfully'
  });
});

/**
 * @desc    Get goal by ID
 * @route   GET /api/goals/:id
 * @access  Private
 */
const getGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goal = await GoalService.getGoalById(id);

  res.status(200).json({
    success: true,
    data: goal
  });
});

/**
 * @desc    Get goals by goal sheet
 * @route   GET /api/goals/sheet/:sheetId
 * @access  Private
 */
const getGoalsBySheet = asyncHandler(async (req, res) => {
  const { sheetId } = req.params;
  const goals = await GoalService.getGoalsBySheet(sheetId);

  res.status(200).json({
    success: true,
    data: goals
  });
});

/**
 * @desc    Submit goals for approval
 * @route   POST /api/goals/sheets/:id/submit
 * @access  Private
 */
const submitGoals = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goalSheet = await GoalService.submitGoals(id, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Goals submitted for approval',
    data: goalSheet
  });
});

/**
 * @desc    Calculate goal progress
 * @route   GET /api/goals/:id/progress
 * @access  Private
 */
const calculateProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const progress = await GoalService.calculateProgress(id);

  res.status(200).json({
    success: true,
    data: progress
  });
});

/**
 * @desc    Get shared goals for user
 * @route   GET /api/goals/shared
 * @access  Private
 */
const getSharedGoals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const sharedGoals = await GoalService.getSharedGoalsForUser(userId);

  res.status(200).json({
    success: true,
    data: sharedGoals
  });
});

/**
 * @desc    Add shared goal participants
 * @route   POST /api/goals/:id/share
 * @access  Private
 */
const shareGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeIds } = req.body;

  const goal = await GoalService.addSharedGoalParticipants(id, employeeIds);

  res.status(200).json({
    success: true,
    message: 'Goal shared successfully',
    data: goal
  });
});

/**
 * @desc    Get goal statistics
 * @route   GET /api/goals/stats/:userId
 * @access  Private
 */
const getGoalStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { fiscalYear } = req.query;

  // This would need a new service method
  const stats = {
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    averageProgress: 0
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

const getMyGoalSheet = asyncHandler(async (req, res) => {
  const { fiscalYear } = req.query;
  const sheets = await GoalService.getGoalSheetsByEmployee(req.user.id, fiscalYear);

  res.status(200).json({
    success: true,
    data: sheets[0] || null
  });
});

const getMyGoals = asyncHandler(async (req, res) => {
  const { fiscalYear } = req.query;
  const goalSheet = await GoalService.getUserGoals(req.user.id, fiscalYear);

  res.status(200).json({
    success: true,
    data: goalSheet
  });
});

const saveMyGoals = asyncHandler(async (req, res) => {
  const { fiscalYear, goals } = req.body;
  const result = await GoalService.saveUserGoals(req.user.id, goals, fiscalYear);

  res.status(200).json({
    success: true,
    message: 'Goals saved successfully',
    data: result
  });
});

const getThrustAreas = asyncHandler(async (req, res) => {
  const thrustAreas = await ThrustArea.findAll({
    where: { isActive: true },
    order: [['name', 'ASC']]
  });

  res.status(200).json({
    success: true,
    data: thrustAreas
  });
});

module.exports = {
  createGoalSheet,
  getGoalSheet,
  getUserGoalSheets,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoal,
  getGoalsBySheet,
  submitGoals,
  calculateProgress,
  getSharedGoals,
  shareGoal,
  getGoalStats,
  getMyGoalSheet,
  getMyGoals,
  saveMyGoals,
  getThrustAreas
};
