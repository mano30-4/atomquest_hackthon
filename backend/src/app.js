const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth.routes');
const goalRoutes = require('./routes/goal.routes');
const approvalRoutes = require('./routes/approval.routes');
const checkinRoutes = require('./routes/checkin.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors(config.cors));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.'
});
if (process.env.DISABLE_RATE_LIMIT !== 'true') {
  app.use('/api/', limiter);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

const healthHandler = async (req, res) => {
  let databaseStatus = 'Connected';
  try {
    await sequelize.authenticate();
  } catch (error) {
    databaseStatus = 'Disconnected';
  }

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: databaseStatus
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
