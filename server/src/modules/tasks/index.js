const { router } = require('./tasks.router');
const { startSlaScheduler } = require('./workflows/sla.scheduler');

startSlaScheduler();

module.exports = {
  router,
};
