const { router } = require('./reports.router');
const { startReportCacheWorkers } = require('./workers/cache.worker');

startReportCacheWorkers();

module.exports = {
  router,
};
