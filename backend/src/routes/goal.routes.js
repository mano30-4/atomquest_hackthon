const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const { authenticate, authorize, authorizeOwnerOrManager } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// Goal Sheet Routes

router.get(
  '/my-goal-sheet',
  authenticate,
  goalController.getMyGoalSheet
);

router.get(
  '/my-goals',
  authenticate,
  goalController.getMyGoals
);

router.put(
  '/my-goals',
  authenticate,
  goalController.saveMyGoals
);

router.get(
  '/thrust-areas',
  authenticate,
  goalController.getThrustAreas
);

router.get(
  '/shared',
  authenticate,
  goalController.getSharedGoals
);

router.get(
  '/stats/:userId',
  authenticate,
  authorizeOwnerOrManager('userId'),
  goalController.getGoalStats
);

router.get(
  '/sheet/:sheetId',
  authenticate,
  goalController.getGoalsBySheet
);

/**
 * @route   POST /api/goals/sheets
 * @desc    Create a new goal sheet
 * @access  Private
 */
router.post(
  '/sheets',
  authenticate,
  validate(schemas.createGoalSheet),
  goalController.createGoalSheet
);

/**
 * @route   GET /api/goals/sheets/:id
 * @desc    Get goal sheet by ID
 * @access  Private
 */
router.get(
  '/sheets/:id',
  authenticate,
  validate(schemas.id, 'params'),
  goalController.getGoalSheet
);

/**
 * @route   GET /api/goals/sheets/user/:userId
 * @desc    Get user's goal sheets
 * @access  Private
 */
router.get(
  '/sheets/user/:userId',
  authenticate,
  authorizeOwnerOrManager('userId'),
  goalController.getUserGoalSheets
);

/**
 * @route   POST /api/goals/sheets/:id/submit
 * @desc    Submit goals for approval
 * @access  Private
 */
router.post(
  '/sheets/:id/submit',
  authenticate,
  validate(schemas.id, 'params'),
  goalController.submitGoals
);

// Goal Routes

/**
 * @route   POST /api/goals
 * @desc    Create a new goal
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  validate(schemas.createGoal),
  goalController.createGoal
);

/**
 * @route   GET /api/goals/:id
 * @desc    Get goal by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  validate(schemas.id, 'params'),
  goalController.getGoal
);

/**
 * @route   PUT /api/goals/:id
 * @desc    Update a goal
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  validate(schemas.id, 'params'),
  validate(schemas.updateGoal),
  goalController.updateGoal
);

/**
 * @route   DELETE /api/goals/:id
 * @desc    Delete a goal
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  validate(schemas.id, 'params'),
  goalController.deleteGoal
);

/**
 * @route   GET /api/goals/sheet/:sheetId
 * @desc    Get goals by goal sheet
 * @access  Private
 */
router.get(
  '/sheet/:sheetId',
  authenticate,
  goalController.getGoalsBySheet
);

/**
 * @route   GET /api/goals/:id/progress
 * @desc    Calculate goal progress
 * @access  Private
 */
router.get(
  '/:id/progress',
  authenticate,
  validate(schemas.id, 'params'),
  goalController.calculateProgress
);

/**
 * @route   GET /api/goals/shared
 * @desc    Get shared goals for user
 * @access  Private
 */
router.get(
  '/shared',
  authenticate,
  goalController.getSharedGoals
);

/**
 * @route   POST /api/goals/:id/share
 * @desc    Share goal with other employees
 * @access  Private
 */
router.post(
  '/:id/share',
  authenticate,
  validate(schemas.id, 'params'),
  goalController.shareGoal
);

/**
 * @route   GET /api/goals/stats/:userId
 * @desc    Get goal statistics
 * @access  Private
 */
router.get(
  '/stats/:userId',
  authenticate,
  authorizeOwnerOrManager('userId'),
  goalController.getGoalStats
);

module.exports = router;
