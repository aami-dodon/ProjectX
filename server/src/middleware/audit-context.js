const {
  auditContextStorage,
  getAuditContext,
  runWithAuditContext,
} = require('@/utils/audit-context-store');

const extractClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (Array.isArray(forwardedFor)) {
    const first = forwardedFor.find((value) => typeof value === 'string' && value.trim());
    if (first) {
      return first.split(',')[0].trim();
    }
  } else if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip ?? null;
};

const attachAuditContext = (req, _res, next) => {
  const existingContext = getAuditContext();
  const contextPatch = {
    userId: req.user?.id ?? existingContext.userId ?? null,
    ip: extractClientIp(req) ?? existingContext.ip ?? null,
    userAgent: req.get('user-agent') ?? existingContext.userAgent ?? null,
  };

  const store = auditContextStorage.getStore();
  if (store) {
    Object.assign(store, contextPatch);
    return next();
  }

  return runWithAuditContext(contextPatch, () => next());
};

module.exports = {
  attachAuditContext,
};
