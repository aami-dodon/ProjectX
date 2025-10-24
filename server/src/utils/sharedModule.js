const path = require('path');

const buildCandidatePaths = (moduleName) => {
  const bases = [
    path.resolve(process.cwd(), 'shared'),
    path.resolve(process.cwd(), '..', 'shared'),
    path.resolve(__dirname, '..', '..', 'shared'),
    path.resolve(__dirname, '..', '..', '..', 'shared'),
  ];

  const uniqueBases = Array.from(new Set(bases));
  return uniqueBases.map((base) => path.join(base, moduleName));
};

const requireShared = (moduleName) => {
  const candidates = buildCandidatePaths(moduleName);
  const attempted = [];

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      return require(candidate);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(candidate)) {
        attempted.push(candidate);
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    `Unable to load shared module '${moduleName}'. Checked: ${attempted.join(', ')}`
  );
};

module.exports = {
  requireShared,
};
