const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const {
  getFrameworkScoresDashboard,
  getControlHealthDashboard,
  getRemediationDashboard,
  getEvidenceDashboard,
} = require('../services/dashboard.service');

const logger = createLogger('reports-cache-worker');

const startReportCacheWorkers = () => {
  if (env.NODE_ENV === 'test') {
    return;
  }

  const intervalMinutes = Number(env.REPORTS_CACHE_REFRESH_INTERVAL_MINUTES ?? 15);
  const intervalMs = Math.max(intervalMinutes, 5) * 60 * 1000;

  const hydrateDashboards = async () => {
    try {
      await Promise.all([
        getFrameworkScoresDashboard({}),
        getControlHealthDashboard({}),
        getRemediationDashboard({}),
        getEvidenceDashboard(),
      ]);
      logger.debug('Reporting cache refreshed');
    } catch (error) {
      logger.warn('Reporting cache refresh failed', { error: error.message });
    }
  };

  setTimeout(hydrateDashboards, 5000);
  setInterval(hydrateDashboards, intervalMs);
};

module.exports = {
  startReportCacheWorkers,
};
