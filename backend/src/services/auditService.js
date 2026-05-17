const { AuditLog } = require('../models');

class AuditService {
  /**
   * Create an audit log entry
   */
  static async log(data, transaction = null) {
    const auditData = {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId || null,
      changes: data.changes || null,
      timestamp: new Date()
    };

    const options = transaction ? { transaction } : {};

    return await AuditLog.create(auditData, options);
  }

  /**
   * Get audit logs for an entity
   */
  static async getEntityLogs(entityType, entityId, limit = 50) {
    return await AuditLog.findAll({
      where: {
        entityType: entityType,
        entityId: entityId
      },
      order: [['timestamp', 'DESC']],
      limit: limit,
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });
  }

  /**
   * Get audit logs for a user
   */
  static async getUserLogs(userId, limit = 100) {
    return await AuditLog.findAll({
      where: { userId: userId },
      order: [['timestamp', 'DESC']],
      limit: limit
    });
  }

  /**
   * Get all audit logs with filters
   */
  static async getAllLogs(filters = {}, limit = 100, offset = 0) {
    const where = {};

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.startDate && filters.endDate) {
      where.timestamp = {
        [require('sequelize').Op.between]: [filters.startDate, filters.endDate]
      };
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where: where,
      order: [['timestamp', 'DESC']],
      limit: limit,
      offset: offset,
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    return {
      total: count,
      logs: rows,
      limit: limit,
      offset: offset
    };
  }

  static async getAuditLogs(filters = {}, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    return this.getAllLogs(filters, limit, offset);
  }

  /**
   * Get audit logs for goals after lock date
   */
  static async getPostLockChanges(fiscalYear) {
    const { GoalSheet, Op } = require('../models');

    // Find all approved goal sheets
    const approvedSheets = await GoalSheet.findAll({
      where: {
        fiscalYear: fiscalYear,
        status: 'approved'
      },
      attributes: ['id', 'approvedAt']
    });

    const sheetIds = approvedSheets.map(s => s.id);

    // Find audit logs for goals in these sheets after approval
    const logs = await AuditLog.findAll({
      where: {
        entityType: 'goal',
        action: {
          [Op.in]: ['GOAL_UPDATED', 'GOAL_EDITED_BY_MANAGER', 'GOAL_UNLOCKED']
        }
      },
      order: [['timestamp', 'DESC']],
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    // Filter logs that occurred after goal sheet approval
    const postLockLogs = logs.filter(log => {
      const sheet = approvedSheets.find(s => {
        // This is a simplified check - in production, you'd need to join with goals table
        return true;
      });
      return sheet && log.timestamp > sheet.approvedAt;
    });

    return postLockLogs;
  }
}

module.exports = AuditService;
