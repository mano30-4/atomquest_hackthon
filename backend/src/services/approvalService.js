const { GoalSheet, Goal, User, sequelize } = require('../models');
const AuditService = require('./auditService');

class ApprovalService {
  /**
   * Get pending approvals for a manager
   */
  static async getPendingApprovals(managerId) {
    const manager = await User.findByPk(managerId);
    const subordinateWhere = manager?.role === 'admin' ? { role: 'employee' } : { managerId };
    const subordinates = await User.findAll({
      where: subordinateWhere,
      attributes: ['id']
    });

    const subordinateIds = subordinates.map(s => s.id);

    const pendingGoalSheets = await GoalSheet.findAll({
      where: {
        userId: subordinateIds,
        status: 'submitted'
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: Goal,
          as: 'goals'
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    return pendingGoalSheets;
  }

  /**
   * Get team member's goals for review
   */
  static async getTeamMemberGoals(managerId, employeeId, fiscalYear) {
    // Verify manager-employee relationship
    const employee = await User.findByPk(employeeId);
    if (!employee || employee.managerId !== managerId) {
      throw new Error('Unauthorized: Not the reporting manager');
    }

    const goalSheet = await GoalSheet.findOne({
      where: {
        userId: employeeId,
        fiscalYear
      },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: Goal,
          as: 'goals'
        }
      ]
    });

    return goalSheet;
  }

  /**
   * Approve goals
   */
  static async approveGoals(managerId, goalSheetId, comments = null) {
    const transaction = await sequelize.transaction();

    try {
      const goalSheet = await GoalSheet.findByPk(goalSheetId, {
        include: [
          {
            model: User,
            as: 'employee'
          },
          {
            model: Goal,
            as: 'goals'
          }
        ]
      });

      if (!goalSheet) {
        throw new Error('Goal sheet not found');
      }

      // Verify manager authority
      const manager = await User.findByPk(managerId);
      if (manager?.role !== 'admin' && goalSheet.employee.managerId !== managerId) {
        throw new Error('Unauthorized: Not the reporting manager');
      }

      // Check current status
      if (goalSheet.status !== 'submitted') {
        throw new Error('Goals must be in submitted status to approve');
      }

      // Validate goals one more time
      const GoalService = require('./goalService');
      const validation = GoalService.validateGoalSet(goalSheet.goals);
      if (!validation.isValid) {
        throw new Error('Goal validation failed: ' + JSON.stringify(validation.errors));
      }

      // Update goal sheet status
      await goalSheet.update({
        status: 'approved',
        approvedBy: managerId,
        approvedAt: new Date(),
        managerComments: comments
      }, { transaction });

      // Lock all goals
      await Goal.update(
        { isLocked: true },
        {
          where: { goalSheetId: goalSheetId },
          transaction
        }
      );

      // Create audit log
      await AuditService.log({
        action: 'GOALS_APPROVED',
        entityType: 'goal_sheet',
        entityId: goalSheetId,
        userId: managerId,
        changes: {
          status: { from: 'submitted', to: 'approved' },
          comments: comments,
          approvedAt: new Date()
        }
      }, transaction);

      await transaction.commit();

      return goalSheet;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Return goals for rework
   */
  static async returnForRework(managerId, goalSheetId, feedback) {
    const transaction = await sequelize.transaction();

    try {
      if (!feedback || feedback.trim().length === 0) {
        throw new Error('Feedback is required when returning goals for rework');
      }

      const goalSheet = await GoalSheet.findByPk(goalSheetId, {
        include: [
          {
            model: User,
            as: 'employee'
          }
        ]
      });

      if (!goalSheet) {
        throw new Error('Goal sheet not found');
      }

      // Verify manager authority
      const manager = await User.findByPk(managerId);
      if (manager?.role !== 'admin' && goalSheet.employee.managerId !== managerId) {
        throw new Error('Unauthorized: Not the reporting manager');
      }

      // Check current status
      if (goalSheet.status !== 'submitted') {
        throw new Error('Only submitted goals can be returned for rework');
      }

      // Update status
      await goalSheet.update({
        status: 'returned',
        returnedBy: managerId,
        returnedAt: new Date(),
        managerFeedback: feedback
      }, { transaction });

      // Create audit log
      await AuditService.log({
        action: 'GOALS_RETURNED',
        entityType: 'goal_sheet',
        entityId: goalSheetId,
        userId: managerId,
        changes: {
          status: { from: 'submitted', to: 'returned' },
          feedback: feedback,
          returnedAt: new Date()
        }
      }, transaction);

      await transaction.commit();

      return goalSheet;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Edit goals inline during approval
   */
  static async editDuringApproval(managerId, goalId, updates) {
    const transaction = await sequelize.transaction();

    try {
      const goal = await Goal.findByPk(goalId, {
        include: [
          {
            model: GoalSheet,
            as: 'goalSheet',
            include: [
              {
                model: User,
                as: 'employee'
              }
            ]
          }
        ]
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Verify manager authority
      if (goal.goalSheet.employee.managerId !== managerId) {
        throw new Error('Unauthorized: Not the reporting manager');
      }

      // Check if goal sheet is in submitted status
      if (goal.goalSheet.status !== 'submitted') {
        throw new Error('Goals can only be edited during approval (submitted status)');
      }

      // Only allow editing target and weightage
      const allowedFields = ['target', 'weightage'];
      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        throw new Error('No valid fields to update. Only target and weightage can be edited.');
      }

      // Store original values
      const originalValues = {
        target: goal.target,
        weightage: goal.weightage
      };

      // Update goal
      await goal.update(filteredUpdates, { transaction });

      // Validate total weightage after update
      const allGoals = await Goal.findAll({
        where: { goalSheetId: goal.goalSheetId }
      });

      const GoalService = require('./goalService');
      const validation = GoalService.validateGoalSet(allGoals);
      if (!validation.isValid) {
        throw new Error('Validation failed after edit: ' + JSON.stringify(validation.errors));
      }

      // Create audit log
      await AuditService.log({
        action: 'GOAL_EDITED_BY_MANAGER',
        entityType: 'goal',
        entityId: goalId,
        userId: managerId,
        changes: {
          before: originalValues,
          after: filteredUpdates
        }
      }, transaction);

      await transaction.commit();

      return goal;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get all team members and their goal status
   */
  static async getTeamOverview(managerId, fiscalYear = require('../config').app.fiscalYear) {
    const manager = await User.findByPk(managerId);
    const subordinates = await User.findAll({
      where: manager?.role === 'admin' ? { role: 'employee' } : { managerId },
      attributes: ['id', 'name', 'email', 'department'],
      include: [
        {
          model: GoalSheet,
          as: 'goalSheets',
          where: { fiscalYear },
          required: false,
          include: [
            {
              model: Goal,
              as: 'goals',
              attributes: ['id', 'status', 'weightage']
            }
          ]
        }
      ]
    });

    return subordinates.map(emp => {
      const goalSheet = emp.goalSheets[0];
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        email: emp.email,
        department: emp.department,
        goalSheetStatus: goalSheet ? goalSheet.status : 'not_started',
        goalCount: goalSheet ? goalSheet.goals.length : 0,
        totalWeightage: goalSheet
          ? goalSheet.goals.reduce((sum, g) => sum + parseFloat(g.weightage), 0)
          : 0,
        submittedAt: goalSheet ? goalSheet.updatedAt : null
      };
    });
  }
}

module.exports = ApprovalService;
