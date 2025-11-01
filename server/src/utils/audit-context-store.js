const { AsyncLocalStorage } = require('node:async_hooks');

const auditContextStorage = new AsyncLocalStorage();

const runWithAuditContext = (context, callback) => {
  return auditContextStorage.run(context, callback);
};

const getAuditContext = () => auditContextStorage.getStore() ?? {};

const runWithPatchedAuditContext = (contextPatch, callback) => {
  const store = auditContextStorage.getStore();
  if (store) {
    Object.assign(store, contextPatch);
    return callback();
  }

  return runWithAuditContext({ ...contextPatch }, callback);
};

module.exports = {
  auditContextStorage,
  runWithAuditContext,
  getAuditContext,
  runWithPatchedAuditContext,
};
