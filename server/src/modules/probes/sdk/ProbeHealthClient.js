const STATUSES = ['operational', 'degraded', 'outage'];

class ProbeHealthClient {
  constructor({ heartbeatIntervalSeconds = 300 } = {}) {
    this.heartbeatIntervalSeconds = heartbeatIntervalSeconds;
  }

  classifyStatus(status) {
    if (!status || typeof status !== 'string') {
      return 'unknown';
    }

    const normalized = status.trim().toLowerCase();
    if (STATUSES.includes(normalized)) {
      return normalized;
    }

    return 'unknown';
  }

  async runSelfTest({ probe, manifest } = {}) {
    const checks = [
      {
        name: 'config-overlay',
        passed: Boolean(manifest?.overlayId ?? probe?.environmentOverlays),
      },
      {
        name: 'version-target',
        passed: Boolean(manifest?.version ?? probe?.sdkVersionTarget),
      },
    ];

    const passed = checks.every((check) => check.passed);
    return {
      passed,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = {
  ProbeHealthClient,
};
