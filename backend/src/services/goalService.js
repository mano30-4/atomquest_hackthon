const { Goal, GoalSheet, User, Checkin, sequelize } = require('../models');
const config = require('../config');
const AuditService = require('./auditService');

class GoalService {
  static async createGoalSheet(userId, fiscalYear = config.app.fiscalYear) {
    const [goalSheet] = await GoalSheet.findOrCreate({
      where: { userId, fiscalYear },
      defaults: { userId, fiscalYear, status: 'draft' }
    });

    return goalSheet;
  }

  static async getGoalSheetById(goalSheetId) {
    const goalSheet = await GoalSheet.findByPk(goalSheetId, {
      include: [
        { model: User, as: 'employee', attributes: ['id', 'name', 'email', 'department', 'managerId'] },
        { model: Goal, as: 'goals', include: [{ model: Checkin, as: 'checkins', required: false }] }
      ]
    });

    if (!goalSheet) {
      throw new Error('Goal sheet not found');
    }

    return goalSheet;
  }

  static async getGoalSheetsByEmployee(userId, fiscalYear = config.app.fiscalYear) {
    return GoalSheet.findAll({
      where: { userId, ...(fiscalYear ? { fiscalYear } : {}) },
      include: [{ model: Goal, as: 'goals', include: [{ model: Checkin, as: 'checkins', required: false }] }],
      order: [['createdAt', 'DESC']]
    });
  }

  static async createGoal(goalData, userId = null) {
    const goalSheet = await GoalSheet.findByPk(goalData.goalSheetId);
    if (!goalSheet) {
      throw new Error('Goal sheet not found');
    }
    if (userId && goalSheet.userId !== userId) {
      throw new Error('Unauthorized to create a goal on this sheet');
    }

    return Goal.create({
      goalSheetId: goalData.goalSheetId,
      thrustArea: goalData.thrustArea,
      title: goalData.title,
      description: goalData.description || null,
      uom: goalData.uom,
      target: String(goalData.target),
      weightage: goalData.weightage,
      status: goalData.status || 'not_started'
    });
  }

  static async getGoalsBySheet(goalSheetId) {
    return Goal.findAll({
      where: { goalSheetId },
      include: [{ model: Checkin, as: 'checkins', required: false }],
      order: [['id', 'ASC']]
    });
  }

  static async deleteGoal(goalId, userId = null) {
    const goal = await this.getGoalById(goalId);
    if (userId && goal.goalSheet.userId !== userId) {
      throw new Error('Unauthorized to delete this goal');
    }
    await goal.destroy();
  }

  static async saveUserGoals(userId, goals, fiscalYear = config.app.fiscalYear) {
    const transaction = await sequelize.transaction();

    try {
      let goalSheet = await GoalSheet.findOne({ where: { userId, fiscalYear } });
      if (!goalSheet) {
        goalSheet = await GoalSheet.create({ userId, fiscalYear, status: 'draft' }, { transaction });
      }

      if (!['draft', 'returned'].includes(goalSheet.status)) {
        throw new Error('Only draft or returned goal sheets can be edited');
      }

      await Goal.destroy({ where: { goalSheetId: goalSheet.id }, transaction });
      const savedGoals = await Promise.all(
        goals.map(goal => Goal.create({
          goalSheetId: goalSheet.id,
          thrustArea: goal.thrustArea,
          title: goal.title,
          description: goal.description || null,
          uom: goal.uom,
          target: String(goal.target),
          weightage: goal.weightage,
          status: goal.status || 'not_started'
        }, { transaction }))
      );

      await transaction.commit();
      return { goalSheet, goals: savedGoals };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Validate goal set against business rules
   * Rules:
   * - Maximum 8 goals per employee
   * - Total weightage must equal 100%
   * - Minimum weightage per goal is 10%
   */
  static validateGoalSet(goals) {
    const errors = [];

    // Rule 1: Maximum 8 goals
    if (goals.length > config.app.maxGoalsPerEmployee) {
      errors.push({
        rule: 'MAX_GOALS',
        message: `Maximum ${config.app.maxGoalsPerEmployee} goals allowed per employee`,
        current: goals.length,
        max: config.app.maxGoalsPerEmployee
      });
    }

    // Rule 2: Total weightage must equal 100%
    const totalWeightage = goals.reduce((sum, g) => sum + parseFloat(g.weightage || 0), 0);
    if (Math.abs(totalWeightage - config.app.totalWeightageRequired) > 0.01) {
      errors.push({
        rule: 'TOTAL_WEIGHTAGE',
        message: `Total weightage must equal ${config.app.totalWeightageRequired}%`,
        current: totalWeightage,
        required: config.app.totalWeightageRequired
      });
    }

    // Rule 3: Minimum weightage per goal is 10%
    const invalidWeightage = goals.filter(g => parseFloat(g.weightage || 0) < config.app.minWeightagePerGoal);
    if (invalidWeightage.length > 0) {
      errors.push({
        rule: 'MIN_WEIGHTAGE',
        message: `Each goal must have at least ${config.app.minWeightagePerGoal}% weightage`,
        invalidGoals: invalidWeightage.map(g => ({
          title: g.title,
          weightage: g.weightage
        }))
      });
    }

    // Rule 4: Validate required fields
    goals.forEach((goal, index) => {
      if (!goal.thrustArea) {
        errors.push({
          rule: 'REQUIRED_FIELD',
          message: `Goal ${index + 1}: Thrust Area is required`
        });
      }
      if (!goal.title || goal.title.trim().length === 0) {
        errors.push({
          rule: 'REQUIRED_FIELD',
          message: `Goal ${index + 1}: Title is required`
        });
      }
      if (!goal.uom) {
        errors.push({
          rule: 'REQUIRED_FIELD',
          message: `Goal ${index + 1}: Unit of Measurement is required`
        });
      }
      if (!goal.target) {
        errors.push({
          rule: 'REQUIRED_FIELD',
          message: `Goal ${index + 1}: Target is required`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Calculate progress score based on UoM type
   */
  static calculateProgress(goal, achievement) {
    const { uom, target } = goal;
    const achievementValue = parseFloat(achievement);
    const targetValue = parseFloat(target);

    if (isNaN(achievementValue) && uom !== 'timeline' && uom !== 'zero') {
      return 0;
    }

    switch (uom) {
      case 'numeric_min':
      case 'percentage_min':
        // Higher is better (e.g., Sales Revenue)
        return Math.min((achievementValue / targetValue) * 100, 100);

      case 'numeric_max':
      case 'percentage_max':
        // Lower is better (e.g., TAT, Cost)
        if (achievementValue === 0) return 100;
        return achievementValue <= targetValue
          ? 100
          : Math.max((targetValue / achievementValue) * 100, 0);

      case 'timeline':
        // Date-based completion
        const completionDate = new Date(achievement);
        const deadline = new Date(target);

        if (isNaN(completionDate.getTime()) || isNaN(deadline.getTime())) {
          return 0;
        }

        if (completionDate <= deadline) {
          return 100;
        } else {
          const daysLate = Math.ceil((completionDate - deadline) / (1000 * 60 * 60 * 24));
          return Math.max(100 - (daysLate * 5), 0); // 5% penalty per day late
        }

      case 'zero':
        // Zero = Success (e.g., Safety incidents)
        return achievementValue === 0 ? 100 : 0;

      default:
        throw new Error(`Unknown UoM type: ${uom}`);
    }
  }

  /**
   * Create goals with transaction
   */
  static async createGoals(userId, goals, fiscalYear = config.app.fiscalYear) {
    const transaction = await sequelize.transaction();

    try {
      // Validate goal set
      const validation = this.validateGoalSet(goals);
      if (!validation.isValid) {
        throw new Error(JSON.stringify(validation.errors));
      }

      // Check if goal sheet already exists
      let goalSheet = await GoalSheet.findOne({
        where: { userId, fiscalYear }
      });

      if (goalSheet && goalSheet.status !== 'draft' && goalSheet.status !== 'returned') {
        throw new Error('Goal sheet already submitted or approved for this fiscal year');
      }

      // Create or update goal sheet
      if (!goalSheet) {
        goalSheet = await GoalSheet.create({
          userId,
          fiscalYear,
          status: 'draft'
        }, { transaction });
      } else {
        // Delete existing goals if updating
        await Goal.destroy({
          where: { goalSheetId: goalSheet.id },
          transaction
        });
      }

      // Create individual goals
      const createdGoals = await Promise.all(
        goals.map(goal =>
          Goal.create({
            goalSheetId: goalSheet.id,
            thrustArea: goal.thrustArea,
            title: goal.title,
            description: goal.description || null,
            uom: goal.uom,
            target: goal.target,
            weightage: goal.weightage,
            status: 'not_started'
          }, { transaction })
        )
      );

      // Create audit log
      await AuditService.log({
        action: 'GOALS_CREATED',
        entityType: 'goal_sheet',
        entityId: goalSheet.id,
        userId: userId,
        changes: {
          goalCount: createdGoals.length,
          totalWeightage: goals.reduce((sum, g) => sum + parseFloat(g.weightage), 0)
        }
      }, transaction);

      await transaction.commit();

      return {
        goalSheet,
        goals: createdGoals
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get user's goals
   */
  static async getUserGoals(userId, fiscalYear = config.app.fiscalYear) {
    const goalSheet = await GoalSheet.findOne({
      where: { userId, fiscalYear },
      include: [
        {
          model: Goal,
          as: 'goals',
          include: [
            {
              model: Checkin,
              as: 'checkins'
            }
          ]
        }
      ]
    });

    return goalSheet;
  }

  /**
   * Get goal by ID
   */
  static async getGoalById(goalId) {
    const goal = await Goal.findByPk(goalId, {
      include: [
        {
          model: GoalSheet,
          as: 'goalSheet',
          include: [
            {
              model: User,
              as: 'employee',
              attributes: ['id', 'name', 'email', 'role', 'managerId']
            }
          ]
        },
        {
          model: Checkin,
          as: 'checkins'
        }
      ]
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    return goal;
  }

  /**
   * Update goal (only allowed before approval)
   */
  static async updateGoal(goalId, updates, userId) {
    const transaction = await sequelize.transaction();

    try {
      const goal = await this.getGoalById(goalId);

      // Check if goal is locked
      if (goal.isLocked) {
        throw new Error('Cannot update locked goals. Contact admin for unlock.');
      }

      // Check ownership
      if (goal.goalSheet.userId !== userId) {
        throw new Error('Unauthorized to update this goal');
      }

      // Check if goal sheet is in editable status
      if (!['draft', 'returned'].includes(goal.goalSheet.status)) {
        throw new Error('Goals can only be updated in draft or returned status');
      }

      // Store original values for audit
      const originalValues = {
        title: goal.title,
        description: goal.description,
        target: goal.target,
        weightage: goal.weightage
      };

      // Update goal
      await goal.update(updates, { transaction });

      // Create audit log
      await AuditService.log({
        action: 'GOAL_UPDATED',
        entityType: 'goal',
        entityId: goalId,
        userId: userId,
        changes: {
          before: originalValues,
          after: updates
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
   * Submit goals for approval
   */
  static async submitForApproval(goalSheetId, userId) {
    const transaction = await sequelize.transaction();

    try {
      const goalSheet = await GoalSheet.findByPk(goalSheetId, {
        include: [
          {
            model: Goal,
            as: 'goals'
          },
          {
            model: User,
            as: 'employee'
          }
        ]
      });

      if (!goalSheet) {
        throw new Error('Goal sheet not found');
      }

      // Check ownership
      if (goalSheet.userId !== userId) {
        throw new Error('Unauthorized to submit this goal sheet');
      }

      // Check current status
      if (!['draft', 'returned'].includes(goalSheet.status)) {
        throw new Error('Goal sheet must be in draft or returned status');
      }

      // Validate goals
      const validation = this.validateGoalSet(goalSheet.goals);
      if (!validation.isValid) {
        throw new Error(JSON.stringify(validation.errors));
      }

      // Update status
      await goalSheet.update({
        status: 'submitted'
      }, { transaction });

      // Create audit log
      await AuditService.log({
        action: 'GOALS_SUBMITTED',
        entityType: 'goal_sheet',
        entityId: goalSheetId,
        userId: userId,
        changes: {
          status: { from: goalSheet.status, to: 'submitted' }
        }
      }, transaction);

      await transaction.commit();

      return {
        goalSheet,
        managerId: goalSheet.employee.managerId
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async submitGoals(goalSheetId, userId) {
    return this.submitForApproval(goalSheetId, userId);
  }

  /**
   * Create shared goal for multiple employees
   */
  static async createSharedGoal(managerId, goalData, employeeIds) {
    const transaction = await sequelize.transaction();

    try {
      // Verify manager has authority over all employees
      const employees = await User.findAll({
        where: {
          id: employeeIds,
          managerId: managerId
        }
      });

      if (employees.length !== employeeIds.length) {
        throw new Error('Manager does not have authority over all specified employees');
      }

      // Create primary goal (not attached to any goal sheet)
      const primaryGoal = await Goal.create({
        goalSheetId: null, // Primary shared goal has no sheet
        thrustArea: goalData.thrustArea,
        title: goalData.title,
        description: goalData.description,
        uom: goalData.uom,
        target: goalData.target,
        weightage: 0, // Will be set by each employee
        isShared: true,
        isPrimary: true
      }, { transaction });

      // Link to each employee's goal sheet
      const sharedGoals = await Promise.all(
        employeeIds.map(async (employeeId) => {
          let goalSheet = await GoalSheet.findOne({
            where: { userId: employeeId, fiscalYear: config.app.fiscalYear }
          });

          if (!goalSheet) {
            goalSheet = await GoalSheet.create({
              userId: employeeId,
              fiscalYear: config.app.fiscalYear,
              status: 'draft'
            }, { transaction });
          }

          return Goal.create({
            goalSheetId: goalSheet.id,
            primaryGoalId: primaryGoal.id,
            thrustArea: goalData.thrustArea,
            title: goalData.title,
            description: goalData.description,
            uom: goalData.uom,
            target: goalData.target,
            weightage: 0, // To be set by employee
            isShared: true,
            isReadOnly: true // Title and target are read-only
          }, { transaction });
        })
      );

      // Create audit log
      await AuditService.log({
        action: 'SHARED_GOAL_CREATED',
        entityType: 'goal',
        entityId: primaryGoal.id,
        userId: managerId,
        changes: {
          employeeIds: employeeIds,
          goalTitle: goalData.title
        }
      }, transaction);

      await transaction.commit();

      return {
        primaryGoal,
        sharedGoals
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = GoalService;
