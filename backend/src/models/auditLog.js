module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Action performed (e.g., GOAL_CREATED, GOAL_APPROVED)'
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'entity_type',
      comment: 'Type of entity affected (e.g., goal, goal_sheet)'
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'entity_id',
      comment: 'ID of the affected entity'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who performed the action'
    },
    changes: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'JSON object containing before/after values'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'audit_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ['entity_type', 'entity_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['timestamp']
      },
      {
        fields: ['action']
      }
    ]
  });

  AuditLog.associate = (models) => {
    // AuditLog belongs to User
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return AuditLog;
};
