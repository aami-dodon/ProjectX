const router = require('./governance.router');

const { configureGovernanceScheduler } = require('./schedulers/governance.scheduler');

module.exports = {
  router,
  configureGovernanceScheduler,
};
