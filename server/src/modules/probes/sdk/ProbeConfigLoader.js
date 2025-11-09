const deepMerge = (base = {}, patch = {}) => {
  if (Array.isArray(base) && Array.isArray(patch)) {
    return [...base, ...patch];
  }

  if (typeof base !== 'object' || typeof patch !== 'object' || base === null || patch === null) {
    return patch ?? base;
  }

  const result = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      result[key] = value.slice();
      return;
    }

    if (typeof value === 'object' && value !== null) {
      result[key] = deepMerge(base[key], value);
      return;
    }

    result[key] = value;
  });

  return result;
};

class ProbeConfigLoader {
  constructor({ defaults = {} } = {}) {
    this.defaults = defaults;
  }

  merge(overrides = {}) {
    return deepMerge(this.defaults, overrides ?? {});
  }
}

module.exports = {
  ProbeConfigLoader,
};
