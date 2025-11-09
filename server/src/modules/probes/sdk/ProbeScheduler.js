class ProbeScheduler {
  constructor({ heartbeatIntervalSeconds = 300 } = {}) {
    this.heartbeatIntervalSeconds = heartbeatIntervalSeconds;
    this.defaultCron = '0 */6 * * *';
  }

  normalizeType(type) {
    if (!type || typeof type !== 'string') {
      return 'cron';
    }

    const normalized = type.trim().toLowerCase();
    if (['cron', 'event', 'adhoc'].includes(normalized)) {
      return normalized;
    }

    return 'cron';
  }

  deriveNextWindow({ type, expression } = {}) {
    const normalizedType = this.normalizeType(type);
    const now = Date.now();
    let nextRunAt = new Date(now + 5 * 60 * 1000);

    if (normalizedType === 'cron') {
      const intervalMinutes = this.parseCronInterval(expression ?? this.defaultCron);
      nextRunAt = new Date(now + intervalMinutes * 60 * 1000);
    } else if (normalizedType === 'adhoc') {
      nextRunAt = new Date(now + 60 * 1000);
    }

    return {
      type: normalizedType,
      expression: normalizedType === 'cron' ? expression ?? this.defaultCron : null,
      nextRunAt,
    };
  }

  parseCronInterval(expression) {
    if (!expression || typeof expression !== 'string') {
      return 60;
    }

    const match = expression.match(/\*\/(\d+)/);
    if (match) {
      const minutes = Number(match[1]);
      if (Number.isFinite(minutes) && minutes > 0) {
        return minutes;
      }
    }

    if (/\*/.test(expression)) {
      return 60;
    }

    return 360; // default to every 6 hours when parsing fails
  }
}

module.exports = {
  ProbeScheduler,
};
