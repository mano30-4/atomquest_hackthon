const { Checkin, Goal, GoalSheet, User, CheckinComment, sequelize } = require('../models');
const config = require('../config');
const GoalService = require('./goalService');
const AuditService = require('./auditService');

class CheckinService {
  /**
   * Check if check-in window is open for a quarter
   */
  static isCheckinWindowOpen(quarter) {
    const now = new Date();
    const window = config.quarters[quarter];

    if (!window) {
      throw new Error(`Invalid quarter: ${quarter}`);
    }

    const startDate = new Date(window.start);
    const endDate = new Date(window.end);
    endDate.setHours(23, 59, 59, 999); // End of day

    return now >= startDate && now <= endDate;
  }

  /**
   * Get current active quarter
   */
  static getCurrentQuarter() {
    const now = new Date();

    for (const [quarter, window] of Object.entries(config.quarters)) {
      const startDate = new Date(window.start);
      const endDate = new Date(window.end);
      endDate.setHours(23, 59, 59, 999);

      if (now >= startDate && now <= endDate) {
        return quarter;
      }
    }

    return null; // No active quarter
  }

  /**
   * Employee updates achievement for a goal
   */
  static async updateAchievement(userId, goalId, quarter, achievement, status) {
    const transaction = await sequelize.transaction();

    try {
      const goal = await Goal.findByPk(goalId, {
        include: [
          {
            model: GoalSheet,
            as: 'goalSheet'
          }
        ]
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      // Verify ownership
      if (goal.goalSheet.userId !== userId) {
        throw new Error('Unauthorized to update this goal');
      }

      // Check if goal is locked (approved)
      if (!goal.isLocked) {
        throw new Error('Goals must be approved before updating achievement');
      }

      // Calculate progress
      const progress = GoalService.calculateProgress(goal, achievement);

      // Create or update check-in record
      const [checkin, created] = await Checkin.findOrCreate({
        where: {
          goalId: goalId,
          quarter: quarter
        },
        defaults: {
          plannedTarget: goal.target,
          actualAchievement: achievement,
          progress: progress,
          status: status
        },
        transaction
      });

      if (!created) {
        await checkin.update({
          actualAchievement: achievement,
          progress: progress,
          status: status
        }, { transaction });
      }

      // If shared goal, sync to all linked instances
      if (goal.isShared && goal.primaryGoalId) {
        await this.syncSharedGoalAchievement(
          goal.primaryGoalId,
          quarter,
          achievement,
          status,
          transaction
        );
      }

      // Update goal status
      await goal.update({ status }, { transaction });

      // Create audit log
      await AuditService.log({
        action: 'ACHIEVEMENT_UPDATED',
        entityType: 'checkin',
        entityId: checkin.id,
        userId: userId,
        changes: {
          quarter: quarter,
          achievement: achievement,
          progress: progress,
          status: status
        }
      }, transaction);

      await transaction.commit();

      return checkin;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async createCheckin(goalId, quarter, achievement, comments, employeeId, status = 'on_track') {
    return this.updateAchievement(employeeId, goalId, quarter, achievement, status);
  }

  static async updateCheckin(checkinId, achievement, comments, status = 'on_track') {
    const checkin = await Checkin.findByPk(checkinId, {
      include: [{ model: Goal, as: 'goal' }]
    });
    if (!checkin) {
      throw new Error('Check-in not found');
    }

    const progress = GoalService.calculateProgress(checkin.goal, achievement);
    await checkin.update({
      actualAchievement: achievement,
      progress,
      status
    });
    return checkin;
  }

  static async getCheckinById(checkinId) {
    const checkin = await Checkin.findByPk(checkinId, {
      include: [{ model: Goal, as: 'goal' }]
    });
    if (!checkin) {
      throw new Error('Check-in not found');
    }
    return checkin;
  }

  static async getCheckinsByGoal(goalId) {
    return this.getGoalCheckins(goalId);
  }

  static async getCheckinsByQuarter(userId, quarter) {
    const goalSheet = await this.getUserQuarterCheckins(userId, quarter);
    return goalSheet.goals.flatMap(goal => goal.checkins || []);
  }

  static async getCheckinComments(checkinId) {
    const checkin = await Checkin.findByPk(checkinId, {
      include: [{ model: Goal, as: 'goal', include: [{ model: GoalSheet, as: 'goalSheet' }] }]
    });
    if (!checkin) {
      throw new Error('Check-in not found');
    }
    return this.getManagerComments(checkin.goal.goalSheet.userId, checkin.quarter);
  }

  /**
   * Sync shared goal achievement to all linked instances
   */
  static async syncSharedGoalAchievement(primaryGoalId, quarter, achievement, status, transaction) {
    // Find all shared goal instances
    const sharedGoals = await Goal.findAll({
      where: { primaryGoalId: primaryGoalId }
    });

    // Update achievement for all shared instances
    await Promise.all(
      sharedGoals.map(async (sharedGoal) => {
        const progress = GoalService.calculateProgress(sharedGoal, achievement);

        await Checkin.upsert({
          goalId: sharedGoal.id,
          quarter: quarter,
          plannedTarget: sharedGoal.target,
          actualAchievement: achievement,
          progress: progress,
          status: status,
          syncedFromPrimary: true
        }, { transaction });

        // Update goal status
        await sharedGoal.update({ status }, { transaction });
      })
    );
  }

  /**
   * Get check-ins for a goal
   */
  static async getGoalCheckins(goalId) {
    const goal = await Goal.findByPk(goalId, {
      include: [
        {
          model: Checkin,
          as: 'checkins',
          order: [['quarter', 'ASC']]
        }
      ]
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    return goal.checkins;
  }

  /**
   * Get all check-ins for a user in a quarter
   */
  static async getUserQuarterCheckins(userId, quarter, fiscalYear = config.app.fiscalYear) {
    const goalSheet = await GoalSheet.findOne({
      where: { userId, fiscalYear },
      include: [
        {
          model: Goal,
          as: 'goals',
          include: [
            {
              model: Checkin,
              as: 'checkins',
              where: { quarter },
              required: false
            }
          ]
        }
      ]
    });

    if (!goalSheet) {
      throw new Error('No goal sheet found for this fiscal year');
    }

    return goalSheet;
  }

  /**
   * Manager adds check-in comment
   */
  static async addManagerComment(managerId, employeeId, quarter, comment) {
    const transaction = await sequelize.transaction();

    try {
      // Verify manager-employee relationship
      const employee = await User.findByPk(employeeId);
      if (!employee || employee.managerId !== managerId) {
        throw new Error('Unauthorized: Not the reporting manager');
      }

      if (!comment || comment.trim().length === 0) {
        throw new Error('Comment cannot be empty');
      }

      const checkinComment = await CheckinComment.create({
        employeeId: employeeId,
        managerId: managerId,
        quarter: quarter,
        comment: comment
      }, { transaction });

      // Create audit log
      await AuditService.log({
        action: 'CHECKIN_COMMENT_ADDED',
        entityType: 'checkin_comment',
        entityId: checkinComment.id,
        userId: managerId,
        changes: {
          employeeId: employeeId,
          quarter: quarter,
          comment: comment
        }
      }, transaction);

      await transaction.commit();

      return checkinComment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get manager comments for an employee in a quarter
   */
  static async getManagerComments(employeeId, quarter) {
    const comments = await CheckinComment.findAll({
      where: {
        employeeId: employeeId,
        quarter: quarter
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return comments;
  }

  /**
   * Get team check-in status for a manager
   */
  static async getTeamCheckinStatus(managerId, quarter, fiscalYear = config.app.fiscalYear) {
    const subordinates = await User.findAll({
      where: { managerId },
      attributes: ['id', 'name', 'email', 'department'],
      include: [
        {
          model: GoalSheet,
          as: 'goalSheets',
          where: { fiscalYear, status: 'approved' },
          required: false,
          include: [
            {
              model: Goal,
              as: 'goals',
              include: [
                {
                  model: Checkin,
                  as: 'checkins',
                  where: { quarter },
                  required: false
                }
              ]
            }
          ]
        }
      ]
    });

    return subordinates.map(emp => {
      const goalSheet = emp.goalSheets[0];
      if (!goalSheet) {
        return {
          employeeId: emp.id,
          employeeName: emp.name,
          email: emp.email,
          department: emp.department,
          totalGoals: 0,
          updatedGoals: 0,
          completionPercentage: 0,
          hasComment: false
        };
      }

      const totalGoals = goalSheet.goals.length;
      const updatedGoals = goalSheet.goals.filter(g => g.checkins.length > 0).length;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        email: emp.email,
        department: emp.department,
        totalGoals: totalGoals,
        updatedGoals: updatedGoals,
        completionPercentage: totalGoals > 0 ? (updatedGoals / totalGoals) * 100 : 0,
        hasComment: false // Will be checked separately
      };
    });
  }

  /**
   * Get completion dashboard data
   */
  static async getCompletionDashboard(quarter, fiscalYear = config.app.fiscalYear) {
    const allGoalSheets = await GoalSheet.findAll({
      where: {
        fiscalYear: fiscalYear,
        status: 'approved'
      },
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
              where: { quarter },
              required: false
            }
          ]
        }
      ]
    });

    const summary = {
      totalEmployees: allGoalSheets.length,
      employeesCompleted: 0,
      employeesInProgress: 0,
      employeesNotStarted: 0,
      overallCompletionRate: 0,
      details: []
    };

    allGoalSheets.forEach(sheet => {
      const totalGoals = sheet.goals.length;
      const updatedGoals = sheet.goals.filter(g => g.checkins.length > 0).length;
      const completionRate = totalGoals > 0 ? (updatedGoals / totalGoals) * 100 : 0;

      if (completionRate === 100) {
        summary.employeesCompleted++;
      } else if (completionRate > 0) {
        summary.employeesInProgress++;
      } else {
        summary.employeesNotStarted++;
      }

      summary.details.push({
        employeeId: sheet.employee.id,
        employeeName: sheet.employee.name,
        email: sheet.employee.email,
        department: sheet.employee.department,
        totalGoals: totalGoals,
        updatedGoals: updatedGoals,
        completionRate: completionRate
      });
    });

    summary.overallCompletionRate = summary.totalEmployees > 0
      ? (summary.employeesCompleted / summary.totalEmployees) * 100
      : 0;

    return summary;
  }
}

module.exports = CheckinService;
