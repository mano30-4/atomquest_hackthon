const { asyncHandler } = require('../middleware/errorHandler');
const AuditService = require('../services/auditService');
const { Goal, GoalSheet, User, Checkin } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const getReportGoalSheets = async ({ fiscalYear, employeeId, quarter, user }) => {
  const whereClause = {};
  if (fiscalYear) whereClause.fiscalYear = fiscalYear;
  if (employeeId) whereClause.userId = employeeId;

  const employeeWhere = {};
  if (user.role === 'manager') employeeWhere.managerId = user.id;

  return GoalSheet.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email', 'department', 'managerId'],
        where: Object.keys(employeeWhere).length > 0 ? employeeWhere : undefined
      },
      {
        model: Goal,
        as: 'goals',
        include: [
          {
            model: Checkin,
            as: 'checkins',
            where: quarter ? { quarter } : {},
            required: false
          }
        ]
      }
    ],
    order: [
      [{ model: User, as: 'employee' }, 'name', 'ASC'],
      [{ model: Goal, as: 'goals' }, 'id', 'ASC']
    ]
  });
};

const flattenAchievementRows = (goalSheets, requestedQuarter) => goalSheets.flatMap((sheet) =>
  sheet.goals.flatMap((goal) => {
    const checkins = goal.checkins && goal.checkins.length > 0
      ? goal.checkins
      : [{ quarter: requestedQuarter || '', actualAchievement: '', progress: 0, status: goal.status }];

    return checkins.map((checkin) => ({
      employeeName: sheet.employee.name,
      email: sheet.employee.email,
      department: sheet.employee.department,
      fiscalYear: sheet.fiscalYear,
      sheetStatus: sheet.status,
      goalTitle: goal.title,
      thrustArea: goal.thrustArea,
      uom: goal.uom,
      target: goal.target,
      weightage: goal.weightage,
      quarter: checkin.quarter,
      achievement: checkin.actualAchievement,
      progress: checkin.progress,
      status: checkin.status || goal.status
    }));
  })
);

/**
 * @desc    Get achievement report
 * @route   GET /api/reports/achievement
 * @access  Private (Manager/Admin)
 */
const getAchievementReport = asyncHandler(async (req, res) => {
  const { fiscalYear, employeeId, quarter } = req.query;

  const goalSheets = await getReportGoalSheets({ fiscalYear, employeeId, quarter, user: req.user });

  const report = goalSheets.map(sheet => {
    const goals = sheet.goals.map(goal => {
      const checkins = goal.checkins || [];
      const latestCheckin = checkins[checkins.length - 1];
      
      return {
        id: goal.id,
        description: goal.description,
        thrustArea: goal.thrustArea,
        target: goal.target,
        uom: goal.uom,
        weightage: goal.weightage,
        achievement: latestCheckin?.actualAchievement || '',
        progress: latestCheckin?.progress || 0
      };
    });

    const totalWeightedScore = goals.reduce((sum, goal) => {
      return sum + (goal.progress * goal.weightage / 100);
    }, 0);

    return {
      employeeId: sheet.employee.id,
      employeeName: sheet.employee.name,
      fiscalYear: sheet.fiscalYear,
      status: sheet.status,
      goals,
      totalWeightedScore: totalWeightedScore.toFixed(2),
      goalCount: goals.length
    };
  });

  res.status(200).json({
    success: true,
    data: report
  });
});

/**
 * @desc    Get completion dashboard
 * @route   GET /api/reports/completion
 * @access  Private (Manager/Admin)
 */
const getCompletionDashboard = asyncHandler(async (req, res) => {
  const { fiscalYear, quarter } = req.query;
  const managerId = req.user.role === 'admin' ? null : req.user.id;

  const whereClause = {};
  if (fiscalYear) whereClause.fiscalYear = fiscalYear;
  if (managerId) whereClause['$employee.managerId$'] = managerId;

  const goalSheets = await GoalSheet.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'managerId', 'department']
      },
      {
        model: Goal,
        as: 'goals',
        include: [
          {
            model: Checkin,
            as: 'checkins',
            where: quarter ? { quarter } : {},
            required: false
          }
        ]
      }
    ]
  });

  const dashboard = goalSheets.map(sheet => {
    const totalGoals = sheet.goals.length;
    const completedCheckins = sheet.goals.filter(goal => 
      goal.checkins && goal.checkins.length > 0
    ).length;

    return {
      employeeId: sheet.employee.id,
      employeeName: sheet.employee.name,
      totalGoals,
      completedCheckins,
      pendingCheckins: totalGoals - completedCheckins,
      completionPercentage: totalGoals > 0 
        ? ((completedCheckins / totalGoals) * 100).toFixed(2)
        : 0
    };
  });

  res.status(200).json({
    success: true,
    data: dashboard
  });
});

/**
 * @desc    Get audit logs
 * @route   GET /api/reports/audit-logs
 * @access  Private (Admin)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, entityId, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

  const filters = {};
  if (entityType) filters.entityType = entityType;
  if (entityId) filters.entityId = entityId;
  if (userId) filters.userId = userId;
  if (startDate || endDate) {
    filters.timestamp = {};
    if (startDate) filters.timestamp[Op.gte] = new Date(startDate);
    if (endDate) filters.timestamp[Op.lte] = new Date(endDate);
  }

  const logs = await AuditService.getAuditLogs(filters, parseInt(page), parseInt(limit));

  res.status(200).json({
    success: true,
    data: logs
  });
});

/**
 * @desc    Export achievement report to CSV
 * @route   GET /api/reports/export/achievement
 * @access  Private (Manager/Admin)
 */
const exportAchievementCSV = asyncHandler(async (req, res) => {
  const { fiscalYear, employeeId, quarter } = req.query;
  const goalSheets = await getReportGoalSheets({ fiscalYear, employeeId, quarter, user: req.user });
  const rows = flattenAchievementRows(goalSheets, quarter);
  const columns = [
    'employeeName',
    'email',
    'department',
    'fiscalYear',
    'sheetStatus',
    'goalTitle',
    'thrustArea',
    'uom',
    'target',
    'weightage',
    'quarter',
    'achievement',
    'progress',
    'status'
  ];

  const csv = [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvValue(row[column])).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="achievement-report.csv"');
  res.status(200).send(csv);
});

/**
 * @desc    Export completion report to Excel
 * @route   GET /api/reports/export/completion
 * @access  Private (Manager/Admin)
 */
const exportCompletionExcel = asyncHandler(async (req, res) => {
  const { fiscalYear, quarter } = req.query;
  const managerId = req.user.role === 'admin' ? null : req.user.id;

  const whereClause = {};
  if (fiscalYear) whereClause.fiscalYear = fiscalYear;
  if (managerId) whereClause['$employee.managerId$'] = managerId;

  const goalSheets = await GoalSheet.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'employee',
        attributes: ['id', 'name', 'email', 'department', 'managerId']
      },
      {
        model: Goal,
        as: 'goals',
        include: [
          {
            model: Checkin,
            as: 'checkins',
            where: quarter ? { quarter } : {},
            required: false
          }
        ]
      }
    ],
    order: [[{ model: User, as: 'employee' }, 'name', 'ASC']]
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Completion');
  worksheet.columns = [
    { header: 'Employee', key: 'employeeName', width: 24 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Fiscal Year', key: 'fiscalYear', width: 14 },
    { header: 'Goal Sheet Status', key: 'sheetStatus', width: 18 },
    { header: 'Total Goals', key: 'totalGoals', width: 12 },
    { header: 'Completed Check-ins', key: 'completedCheckins', width: 20 },
    { header: 'Pending Check-ins', key: 'pendingCheckins', width: 18 },
    { header: 'Completion %', key: 'completionPercentage', width: 16 }
  ];

  goalSheets.forEach((sheet) => {
    const totalGoals = sheet.goals.length;
    const completedCheckins = sheet.goals.filter((goal) => goal.checkins && goal.checkins.length > 0).length;
    worksheet.addRow({
      employeeName: sheet.employee.name,
      email: sheet.employee.email,
      department: sheet.employee.department,
      fiscalYear: sheet.fiscalYear,
      sheetStatus: sheet.status,
      totalGoals,
      completedCheckins,
      pendingCheckins: totalGoals - completedCheckins,
      completionPercentage: totalGoals > 0 ? Number(((completedCheckins / totalGoals) * 100).toFixed(2)) : 0
    });
  });

  worksheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="completion-report.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

/**
 * @desc    Get goal statistics
 * @route   GET /api/reports/stats/goals
 * @access  Private (Manager/Admin)
 */
const getGoalStatistics = asyncHandler(async (req, res) => {
  const { fiscalYear } = req.query;
  const managerId = req.user.role === 'admin' ? null : req.user.id;

  const whereClause = {};
  if (fiscalYear) whereClause.fiscalYear = fiscalYear;
  if (managerId) whereClause['$employee.managerId$'] = managerId;

  const goalSheets = await GoalSheet.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'employee',
        attributes: ['managerId']
      },
      {
        model: Goal,
        as: 'goals'
      }
    ]
  });

  const stats = {
    totalEmployees: goalSheets.length,
    totalGoals: goalSheets.reduce((sum, sheet) => sum + sheet.goals.length, 0),
    statusBreakdown: {
      draft: goalSheets.filter(s => s.status === 'draft').length,
      submitted: goalSheets.filter(s => s.status === 'submitted').length,
      approved: goalSheets.filter(s => s.status === 'approved').length,
      returned: goalSheets.filter(s => s.status === 'returned').length,
      locked: goalSheets.filter(s => s.status === 'locked').length
    },
    averageGoalsPerEmployee: goalSheets.length > 0
      ? (goalSheets.reduce((sum, sheet) => sum + sheet.goals.length, 0) / goalSheets.length).toFixed(2)
      : 0
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get thrust area distribution
 * @route   GET /api/reports/stats/thrust-areas
 * @access  Private (Manager/Admin)
 */
const getThrustAreaDistribution = asyncHandler(async (req, res) => {
  const { fiscalYear } = req.query;

  const goals = await Goal.findAll({
    include: [
      {
        model: GoalSheet,
        as: 'goalSheet',
        where: fiscalYear ? { fiscalYear } : {},
        attributes: []
      }
    ]
  });

  const distribution = goals.reduce((acc, goal) => {
    const thrustAreaName = goal.thrustArea || 'Unknown';
    if (!acc[thrustAreaName]) {
      acc[thrustAreaName] = 0;
    }
    acc[thrustAreaName]++;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: distribution
  });
});

module.exports = {
  getAchievementReport,
  getCompletionDashboard,
  getAuditLogs,
  exportAchievementCSV,
  exportCompletionExcel,
  getGoalStatistics,
  getThrustAreaDistribution
};
