const { AsyncLocalStorage } = require('node:async_hooks');

const auditContextStorage = new AsyncLocalStorage();

const runWithAuditContext = (context, callback) => {
  return auditContextStorage.run(context, callback);
};

const getAuditContext = () => auditContextStorage.getStore() ?? {};

module.exports = {
  auditContextStorage,
  runWithAuditContext,
  getAuditContext,
};
