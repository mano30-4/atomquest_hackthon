module.exports = (sequelize, DataTypes) => {
  const GoalSheet = sequelize.define('GoalSheet', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    fiscalYear: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'fiscal_year'
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'returned'),
      allowNull: false,
      defaultValue: 'draft'
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'approved_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'approved_at'
    },
    returnedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'returned_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    returnedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'returned_at'
    },
    managerComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'manager_comments'
    },
    managerFeedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'manager_feedback'
    }
  }, {
    tableName: 'goal_sheets',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'fiscal_year']
      },
      {
        fields: ['status']
      },
      {
        fields: ['fiscal_year']
      }
    ]
  });

  GoalSheet.associate = (models) => {
    // GoalSheet belongs to User (employee)
    GoalSheet.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'employee'
    });

    // GoalSheet belongs to User (approver)
    GoalSheet.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });

    // GoalSheet has many Goals
    GoalSheet.hasMany(models.Goal, {
      foreignKey: 'goalSheetId',
      as: 'goals',
      onDelete: 'CASCADE'
    });
  };

  return GoalSheet;
};
