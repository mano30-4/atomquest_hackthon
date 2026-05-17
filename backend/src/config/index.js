require('dotenv').config();

const configuredCorsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'];

const corsOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  const isConfiguredOrigin = configuredCorsOrigins.includes(origin);

  callback(null, isConfiguredOrigin);
};

module.exports = {
  // Server Configuration
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  host: process.env.HOST || 'localhost',

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },

  // CORS Configuration
  cors: {
    origin: corsOrigin,
    credentials: true
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    toFile: process.env.LOG_TO_FILE === 'true'
  },

  // Application Settings
  app: {
    fiscalYear: process.env.FISCAL_YEAR || '2026-27',
    maxGoalsPerEmployee: parseInt(process.env.MAX_GOALS_PER_EMPLOYEE) || 8,
    minWeightagePerGoal: parseInt(process.env.MIN_WEIGHTAGE_PER_GOAL) || 10,
    totalWeightageRequired: parseInt(process.env.TOTAL_WEIGHTAGE_REQUIRED) || 100
  },

  // Quarterly Check-in Windows
  quarters: {
    Q1: { start: '2026-07-01', end: '2026-07-31', name: 'Q1 Check-in' },
    Q2: { start: '2026-10-01', end: '2026-10-31', name: 'Q2 Check-in' },
    Q3: { start: '2027-01-01', end: '2027-01-31', name: 'Q3 Check-in' },
    Q4: { start: '2027-04-01', end: '2027-04-30', name: 'Q4 Check-in' }
  },

  // Goal Setting Phase
  goalSettingPhase: {
    start: '2026-05-01',
    name: 'Goal Setting Phase'
  }
};
