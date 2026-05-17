module.exports = (sequelize, DataTypes) => {
  const ThrustArea = sequelize.define('ThrustArea', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Name of the thrust area (e.g., Revenue Growth, Operational Efficiency)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the thrust area'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
      comment: 'Whether this thrust area is currently active'
    }
  }, {
    tableName: 'thrust_areas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['is_active']
      }
    ]
  });

  // No associations needed for ThrustArea

  return ThrustArea;
};
