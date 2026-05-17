const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('employee', 'manager', 'admin'),
      allowNull: false,
      defaultValue: 'employee'
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'manager_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          const salt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
        }
      }
    }
  });

  User.associate = (models) => {
    // Self-referencing association for manager
    User.belongsTo(models.User, {
      as: 'manager',
      foreignKey: 'managerId'
    });

    User.hasMany(models.User, {
      as: 'subordinates',
      foreignKey: 'managerId'
    });

    // User has many goal sheets
    User.hasMany(models.GoalSheet, {
      foreignKey: 'userId',
      as: 'goalSheets'
    });

    // User has many audit logs
    User.hasMany(models.AuditLog, {
      foreignKey: 'userId',
      as: 'auditLogs'
    });

    // User has many checkin comments as employee
    User.hasMany(models.CheckinComment, {
      foreignKey: 'employeeId',
      as: 'receivedComments'
    });

    // User has many checkin comments as manager
    User.hasMany(models.CheckinComment, {
      foreignKey: 'managerId',
      as: 'givenComments'
    });
  };

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.passwordHash);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.passwordHash;
    return values;
  };

  return User;
};
