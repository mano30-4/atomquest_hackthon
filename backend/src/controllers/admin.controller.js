const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const AuthService = require('../services/authService');
const { User, GoalSheet, Goal, ThrustArea, AuditLog } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, page = 1, limit = 50 } = req.query;

  const whereClause = {};
  if (role) whereClause.role = role;
  if (isActive !== undefined) whereClause.isActive = isActive === 'true';

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['passwordHash'] },
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'name', 'email']
      }
    ],
    limit: parseInt(limit),
    offset,
    order: [['name', 'ASC']]
  });

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await AuthService.getUserById(id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Create new user
 * @route   POST /api/admin/users
 * @access  Private (Admin)
 */
const createUser = asyncHandler(async (req, res) => {
  const userData = req.body;
  const result = await AuthService.register(userData);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: result
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const user = await AuthService.updateUser(id, updates);

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

/**
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await User.update(
    { isActive: false },
    { where: { id } }
  );

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

/**
 * @desc    Reset user password
 * @route   POST /api/admin/users/:id/reset-password
 * @access  Private (Admin)
 */
const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  await AuthService.resetPassword(id, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});

/**
 * @desc    Get all thrust areas
 * @route   GET /api/admin/thrust-areas
 * @access  Private (Admin)
 */
const getAllThrustAreas = asyncHandler(async (req, res) => {
  const thrustAreas = await ThrustArea.findAll({
    order: [['name', 'ASC']]
  });

  res.status(200).json({
    success: true,
    data: thrustAreas
  });
});

/**
 * @desc    Create thrust area
 * @route   POST /api/admin/thrust-areas
 * @access  Private (Admin)
 */
const createThrustArea = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const thrustArea = await ThrustArea.create({
    name,
    description
  });

  res.status(201).json({
    success: true,
    message: 'Thrust area created successfully',
    data: thrustArea
  });
});

/**
 * @desc    Update thrust area
 * @route   PUT /api/admin/thrust-areas/:id
 * @access  Private (Admin)
 */
const updateThrustArea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const thrustArea = await ThrustArea.findByPk(id);
  if (!thrustArea) {
    throw new ApiError(404, 'Thrust area not found');
  }

  await thrustArea.update({ name, description });

  res.status(200).json({
    success: true,
    message: 'Thrust area updated successfully',
    data: thrustArea
  });
});

/**
 * @desc    Delete thrust area
 * @route   DELETE /api/admin/thrust-areas/:id
 * @access  Private (Admin)
 */
const deleteThrustArea = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const thrustArea = await ThrustArea.findByPk(id);
  if (!thrustArea) {
    throw new ApiError(404, 'Thrust area not found');
  }

  await thrustArea.destroy();

  res.status(200).json({
    success: true,
    message: 'Thrust area deleted successfully'
  });
});

/**
 * @desc    Get system statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
const getSystemStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalGoalSheets,
    totalGoals,
    totalThrustAreas
  ] = await Promise.all([
    User.count(),
    User.count({ where: { isActive: true } }),
    GoalSheet.count(),
    Goal.count(),
    ThrustArea.count()
  ]);

  const stats = {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers
    },
    goalSheets: totalGoalSheets,
    goals: totalGoals,
    thrustAreas: totalThrustAreas,
    averageGoalsPerSheet: totalGoalSheets > 0 
      ? (totalGoals / totalGoalSheets).toFixed(2)
      : 0
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get fiscal year configuration
 * @route   GET /api/admin/fiscal-year
 * @access  Private (Admin)
 */
const getFiscalYearConfig = asyncHandler(async (req, res) => {
  const config = require('../config');

  res.status(200).json({
    success: true,
    data: {
      currentFiscalYear: config.app.fiscalYear,
      quarters: config.quarters,
      goalSettingPhase: config.goalSettingPhase
    }
  });
});

/**
 * @desc    Lock goal sheets for a fiscal year
 * @route   POST /api/admin/lock-goal-sheets
 * @access  Private (Admin)
 */
const lockGoalSheets = asyncHandler(async (req, res) => {
  const { fiscalYear } = req.body;

  const result = await GoalSheet.update(
    { status: 'locked' },
    {
      where: {
        fiscalYear,
        status: 'approved'
      }
    }
  );

  res.status(200).json({
    success: true,
    message: `Locked ${result[0]} goal sheets for fiscal year ${fiscalYear}`,
    data: { lockedCount: result[0] }
  });
});

/**
 * @desc    Get audit log summary
 * @route   GET /api/admin/audit-summary
 * @access  Private (Admin)
 */
const getAuditSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const whereClause = {};
  if (startDate || endDate) {
    whereClause.timestamp = {};
    if (startDate) whereClause.timestamp[Op.gte] = new Date(startDate);
    if (endDate) whereClause.timestamp[Op.lte] = new Date(endDate);
  }

  const logs = await AuditLog.findAll({
    where: whereClause,
    attributes: ['action', 'entityType'],
    raw: true
  });

  const summary = logs.reduce((acc, log) => {
    const key = `${log.entityType}_${log.action}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      totalLogs: logs.length,
      breakdown: summary
    }
  });
});

/**
 * @desc    Bulk import users
 * @route   POST /api/admin/users/bulk-import
 * @access  Private (Admin)
 */
const bulkImportUsers = asyncHandler(async (req, res) => {
  const { users } = req.body;

  const results = [];
  for (const userData of users) {
    try {
      const result = await AuthService.register(userData);
      results.push({ email: userData.email, success: true, data: result });
    } catch (error) {
      results.push({ email: userData.email, success: false, error: error.message });
    }
  }

  res.status(200).json({
    success: true,
    message: 'Bulk import completed',
    data: results
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getAllThrustAreas,
  createThrustArea,
  updateThrustArea,
  deleteThrustArea,
  getSystemStats,
  getFiscalYearConfig,
  lockGoalSheets,
  getAuditSummary,
  bulkImportUsers
};
