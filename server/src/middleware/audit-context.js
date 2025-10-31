const attachAuditContext = (req, res, next) => {
  const context = {
    userId: req.user?.id ?? null,
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  };

  global.auditContext = context;

  res.on('finish', () => {
    if (global.auditContext === context) {
      delete global.auditContext;
    }
  });

  next();
};

module.exports = {
  attachAuditContext,
};
