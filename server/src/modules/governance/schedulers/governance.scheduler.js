const { createLogger } = require('@/utils/logger');
const {
  listDueChecks,
  touchCheckRunMetadata,
} = require('../repositories/checks.repository');

const logger = createLogger('governance-scheduler');

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

const resolveIntervalMs = (frequency) => {
  if (!frequency || typeof frequency !== 'string') {
    return ONE_DAY_MS;
  }

  const normalized = frequency.trim().toLowerCase();
  if (normalized === 'hourly') return ONE_HOUR_MS;
  if (normalized === 'daily') return ONE_DAY_MS;
  if (normalized === 'weekly') return ONE_WEEK_MS;

  const isoMatch = normalized.match(/^pt(?:(\d+)h)?(?:(\d+)m)?$/i);
  if (isoMatch) {
    const hours = parseInt(isoMatch[1] ?? '0', 10);
    const minutes = parseInt(isoMatch[2] ?? '0', 10);
    const totalMs = hours * ONE_HOUR_MS + minutes * 60 * 1000;
    return totalMs > 0 ? totalMs : ONE_DAY_MS;
  }

  const numericMatch = normalized.match(/^(\d+)(h|d)$/);
  if (numericMatch) {
    const value = parseInt(numericMatch[1], 10);
    const unit = numericMatch[2];
    if (unit === 'h') {
      return Math.max(value, 1) * ONE_HOUR_MS;
    }
    if (unit === 'd') {
      return Math.max(value, 1) * ONE_DAY_MS;
    }
  }

  return ONE_DAY_MS;
};

const calculateNextRunAt = (frequency, from = new Date()) => {
  const interval = resolveIntervalMs(frequency);
  return new Date(from.getTime() + interval);
};

const pollDueChecks = async () => {
  const now = new Date();
  const dueChecks = await listDueChecks({ now });

  if (dueChecks.length === 0) {
    return 0;
  }

  await Promise.all(
    dueChecks.map((check) =>
      touchCheckRunMetadata(check.id, {
        lastRunAt: now,
        nextRunAt: calculateNextRunAt(check.frequency, now),
      }),
    ),
  );

  logger.info('Scheduled pending checks for execution', {
    count: dueChecks.length,
  });

  return dueChecks.length;
};

const configureGovernanceScheduler = () => {
  logger.info('Governance scheduler configured (no-op timer placeholder)');
  return {
    pollDueChecks,
  };
};

module.exports = {
  calculateNextRunAt,
  configureGovernanceScheduler,
  pollDueChecks,
};
