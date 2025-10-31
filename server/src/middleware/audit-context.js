const { runWithAuditContext } = require('@/utils/audit-context-store');

const attachAuditContext = (req, _res, next) => {
  const context = {
    userId: req.user?.id ?? null,
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  };

  runWithAuditContext(context, next);
};

module.exports = {
  attachAuditContext,
};
