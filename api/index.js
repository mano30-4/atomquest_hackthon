let app;
let bootstrapPromise;

function getApp() {
  if (!app) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    process.env.DISABLE_RATE_LIMIT = process.env.DISABLE_RATE_LIMIT || 'true';

    app = require('../backend/src/app');
    const { bootstrapRuntimeDb } = require('../backend/scripts/bootstrap-runtime-db');
    bootstrapPromise = bootstrapRuntimeDb({ close: false });
  }

  return app;
}

module.exports = async (req, res) => {
  const expressApp = getApp();
  await bootstrapPromise;
  return expressApp(req, res);
};
