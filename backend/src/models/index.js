const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelizeOptions = {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: dbConfig.logging,
  pool: dbConfig.pool,
  dialectOptions: dbConfig.dialectOptions
};

const sequelize = dbConfig.url
  ? new Sequelize(dbConfig.url, sequelizeOptions)
  : new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      sequelizeOptions
    );

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user')(sequelize, Sequelize);
db.GoalSheet = require('./goalSheet')(sequelize, Sequelize);
db.Goal = require('./goal')(sequelize, Sequelize);
db.Checkin = require('./checkin')(sequelize, Sequelize);
db.CheckinComment = require('./checkinComment')(sequelize, Sequelize);
db.AuditLog = require('./auditLog')(sequelize, Sequelize);
db.ThrustArea = require('./thrustArea')(sequelize, Sequelize);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
