module.exports = (sequelize, DataTypes) => {
  const Goal = sequelize.define('Goal', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    goalSheetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'goal_sheet_id',
      references: {
        model: 'goal_sheets',
        key: 'id'
      }
    },
    primaryGoalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'primary_goal_id',
      references: {
        model: 'goals',
        key: 'id'
      },
      comment: 'For shared goals - references the primary goal'
    },
    thrustArea: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'thrust_area'
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uom: {
      type: DataTypes.ENUM(
        'numeric_min',
        'numeric_max',
        'percentage_min',
        'percentage_max',
        'timeline',
        'zero'
      ),
      allowNull: false,
      comment: 'Unit of Measurement: min=higher is better, max=lower is better'
    },
    target: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Target value - format depends on UoM type'
    },
    weightage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 10,
        max: 100
      },
      comment: 'Weightage percentage (10-100)'
    },
    isShared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_shared',
      comment: 'True if this is a shared/departmental goal'
    },
    isReadOnly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read_only',
      comment: 'True if title and target cannot be edited (shared goals)'
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_locked',
      comment: 'True after manager approval - prevents editing'
    },
    status: {
      type: DataTypes.ENUM('not_started', 'on_track', 'completed'),
      defaultValue: 'not_started',
      comment: 'Current status of the goal'
    }
  }, {
    tableName: 'goals',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['goal_sheet_id']
      },
      {
        fields: ['primary_goal_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['is_shared']
      }
    ],
    validate: {
      weightageRange() {
        if (this.weightage < 10 || this.weightage > 100) {
          throw new Error('Weightage must be between 10 and 100');
        }
      }
    }
  });

  Goal.associate = (models) => {
    // Goal belongs to GoalSheet
    Goal.belongsTo(models.GoalSheet, {
      foreignKey: 'goalSheetId',
      as: 'goalSheet'
    });

    // Self-referencing for shared goals
    Goal.belongsTo(models.Goal, {
      foreignKey: 'primaryGoalId',
      as: 'primaryGoal'
    });

    Goal.hasMany(models.Goal, {
      foreignKey: 'primaryGoalId',
      as: 'sharedInstances'
    });

    // Goal has many Checkins
    Goal.hasMany(models.Checkin, {
      foreignKey: 'goalId',
      as: 'checkins',
      onDelete: 'CASCADE'
    });
  };

  return Goal;
};
