const { AsyncLocalStorage } = require('async_hooks');

const requestContextStorage = new AsyncLocalStorage();

const runWithRequestContext = (context, callback) => {
  if (typeof callback !== 'function') {
    throw new TypeError('Callback must be a function when initializing request context');
  }

  const normalizedContext = context && typeof context === 'object' ? context : {};

  return requestContextStorage.run(normalizedContext, callback);
};

const getRequestContext = () => requestContextStorage.getStore() || null;

module.exports = {
  runWithRequestContext,
  getRequestContext,
};

