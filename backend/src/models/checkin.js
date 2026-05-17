module.exports = (sequelize, DataTypes) => {
  const Checkin = sequelize.define('Checkin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    goalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'goal_id',
      references: {
        model: 'goals',
        key: 'id'
      }
    },
    quarter: {
      type: DataTypes.ENUM('Q1', 'Q2', 'Q3', 'Q4'),
      allowNull: false,
      comment: 'Quarterly check-in period'
    },
    plannedTarget: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'planned_target',
      comment: 'Original target from goal'
    },
    actualAchievement: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'actual_achievement',
      comment: 'Actual achievement value'
    },
    progress: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Calculated progress percentage (0-100)'
    },
    status: {
      type: DataTypes.ENUM('not_started', 'on_track', 'completed'),
      allowNull: true,
      comment: 'Status of goal in this quarter'
    },
    syncedFromPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'synced_from_primary',
      comment: 'True if achievement synced from primary shared goal'
    }
  }, {
    tableName: 'checkins',
    timestamps: true,
    underscored: true,
    updatedAt: 'updated_at',
    createdAt: false,
    indexes: [
      {
        unique: true,
        fields: ['goal_id', 'quarter']
      },
      {
        fields: ['quarter']
      }
    ]
  });

  Checkin.associate = (models) => {
    // Checkin belongs to Goal
    Checkin.belongsTo(models.Goal, {
      foreignKey: 'goalId',
      as: 'goal'
    });
  };

  return Checkin;
};
