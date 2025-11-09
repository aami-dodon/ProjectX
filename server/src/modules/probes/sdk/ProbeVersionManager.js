const { createValidationError } = require('@/utils/errors');

const normalizeVersion = (value) =>
  String(value ?? '0.0.0')
    .split('.')
    .map((part) => Number(part) || 0);

const compareVersions = (a, b) => {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);

  for (let i = 0; i < 3; i += 1) {
    if ((left[i] ?? 0) > (right[i] ?? 0)) {
      return 1;
    }
    if ((left[i] ?? 0) < (right[i] ?? 0)) {
      return -1;
    }
  }

  return 0;
};

class ProbeVersionManager {
  constructor({ minimumVersion = '1.0.0', targetVersion = '1.0.0' } = {}) {
    this.minimumVersion = minimumVersion;
    this.targetVersion = targetVersion;
  }

  assertCompatible(version) {
    const comparison = compareVersions(version, this.minimumVersion);
    if (comparison < 0) {
      throw createValidationError(
        `Probe SDK version ${version} is below the supported minimum (${this.minimumVersion})`,
      );
    }
  }

  planUpgrade(currentVersion) {
    if (compareVersions(currentVersion, this.targetVersion) >= 0) {
      return null;
    }

    return {
      from: currentVersion,
      to: this.targetVersion,
    };
  }
}

module.exports = {
  ProbeVersionManager,
};
