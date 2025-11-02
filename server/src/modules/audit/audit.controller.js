const { listAuditLogs } = require('./audit.service');

const listRecentAuditLogs = async (req, res, next) => {
  try {
    const { logs, total, limit, offset } = await listAuditLogs({
      limit: req.query.limit,
      offset: req.query.offset,
      model: req.query.model,
    });
    res.json({ logs, total, limit, offset });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRecentAuditLogs,
};
