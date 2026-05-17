module.exports = (sequelize, DataTypes) => {
  const CheckinComment = sequelize.define('CheckinComment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'employee_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'manager_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    quarter: {
      type: DataTypes.ENUM('Q1', 'Q2', 'Q3', 'Q4'),
      allowNull: false,
      comment: 'Quarterly check-in period'
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Manager feedback/comment for the quarter'
    }
  }, {
    tableName: 'checkin_comments',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      {
        fields: ['employee_id', 'quarter']
      },
      {
        fields: ['manager_id']
      }
    ]
  });

  CheckinComment.associate = (models) => {
    // CheckinComment belongs to User (employee)
    CheckinComment.belongsTo(models.User, {
      foreignKey: 'employeeId',
      as: 'employee'
    });

    // CheckinComment belongs to User (manager)
    CheckinComment.belongsTo(models.User, {
      foreignKey: 'managerId',
      as: 'manager'
    });
  };

  return CheckinComment;
};
