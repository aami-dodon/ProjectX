const { randomUUID } = require('crypto');

const attachRequestIds = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  const traceId = req.headers['x-trace-id'] || randomUUID();

  req.context = {
    requestId,
    traceId,
  };

  res.setHeader('x-request-id', requestId);
  res.setHeader('x-trace-id', traceId);

  next();
};

module.exports = {
  attachRequestIds,
};
