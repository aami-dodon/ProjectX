const { listAuditLogs } = require('./audit.service');

const listRecentAuditLogs = async (req, res, next) => {
  try {
    const { logs } = await listAuditLogs({ limit: req.query.limit });
    res.json({ logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listRecentAuditLogs,
};
