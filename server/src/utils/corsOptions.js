const normalizeOrigin = (value) => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (trimmed === '*') {
    return '*';
  }

  if (trimmed === 'null') {
    return 'null';
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

const coerceOrigins = (origins) => {
  if (!origins) return [];
  if (Array.isArray(origins)) return origins;
  return [origins];
};

const createCorsOptions = (origins) => {
  const source = coerceOrigins(origins);
  const normalized = source.map(normalizeOrigin).filter(Boolean);
  const originSet = new Set(normalized);
  const allowAll = originSet.has('*');
  const allowNullOrigin = originSet.has('null');

  return {
    credentials: true,
    origin: (requestOrigin, callback) => {
      if (allowAll) {
        callback(null, true);
        return;
      }

      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (requestOrigin === 'null') {
        callback(null, allowNullOrigin);
        return;
      }

      const normalizedOrigin = normalizeOrigin(requestOrigin);
      if (originSet.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  };
};

module.exports = {
  createCorsOptions,
};
