const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const { findTasksPastSla } = require('../repositories/task.repository');
const { evaluateTaskSla } = require('../services/escalation.service');

const logger = createLogger('tasks-sla-scheduler');

let intervalHandle = null;

const runSlaEvaluation = async () => {
  const now = new Date();
  const overdueTasks = await findTasksPastSla({ asOf: now });
  if (!overdueTasks.length) {
    return { evaluated: 0, escalated: 0 };
  }

  const results = await Promise.all(
    overdueTasks.map((task) => evaluateTaskSla({ task, now }).catch((error) => {
      logger.error('Failed to evaluate task SLA', { taskId: task.id, error: error.message });
      return { escalated: false };
    })),
  );

  const escalated = results.filter((result) => result.escalated).length;
  logger.info('Completed SLA evaluation run', {
    evaluated: overdueTasks.length,
    escalated,
  });
  return { evaluated: overdueTasks.length, escalated };
};

const startSlaScheduler = () => {
  if (intervalHandle) {
    return;
  }

  const intervalMs = Math.max(env.TASK_SLA_CHECK_INTERVAL_MINUTES, 5) * 60 * 1000;
  intervalHandle = setInterval(() => {
    runSlaEvaluation().catch((error) => {
      logger.error('Task SLA scheduler run failed', { error: error.message });
    });
  }, intervalMs);
  intervalHandle.unref?.();

  logger.info('Started Task SLA scheduler', {
    intervalMinutes: env.TASK_SLA_CHECK_INTERVAL_MINUTES,
  });
};

const stopSlaScheduler = () => {
  if (!intervalHandle) {
    return;
  }

  clearInterval(intervalHandle);
  intervalHandle = null;
  logger.info('Stopped Task SLA scheduler');
};

module.exports = {
  runSlaEvaluation,
  startSlaScheduler,
  stopSlaScheduler,
};
