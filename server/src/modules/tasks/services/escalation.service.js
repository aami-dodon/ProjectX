const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const { createTaskEvent, updateTaskRecord } = require('../repositories/task.repository');
const { incrementBreachCount } = require('../repositories/task-metric.repository');
const { publishTaskUpdated } = require('../events/task.updated');

const logger = createLogger('tasks-escalation-service');

const deriveSlaState = (task, now = new Date()) => {
  if (!task?.slaDueAt || ['RESOLVED', 'CLOSED'].includes(task.status)) {
    return 'healthy';
  }

  const dueAt = new Date(task.slaDueAt);
  const diffMs = dueAt.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 0) {
    return 'overdue';
  }

  if (diffMinutes <= 60) {
    return 'atRisk';
  }

  return 'healthy';
};

const evaluateTaskSla = async ({ task, now = new Date() }) => {
  if (!task?.id || !task.slaDueAt) {
    return { escalated: false };
  }

  if (['RESOLVED', 'CLOSED'].includes(task.status)) {
    return { escalated: false };
  }

  const dueAt = new Date(task.slaDueAt);
  const diffMinutes = Math.floor((now.getTime() - dueAt.getTime()) / 60000);
  if (diffMinutes < 0) {
    return { escalated: false };
  }

  const thresholds = Array.isArray(env.TASK_ESCALATION_THRESHOLDS_MINUTES)
    ? env.TASK_ESCALATION_THRESHOLDS_MINUTES
    : [];
  let targetLevel = 0;
  thresholds.forEach((threshold, index) => {
    if (diffMinutes >= threshold) {
      targetLevel = index + 1;
    }
  });

  const currentLevel = task.escalationLevel ?? 0;
  if (targetLevel <= currentLevel) {
    return { escalated: false };
  }

  const updated = await updateTaskRecord(task.id, {
    escalationLevel: targetLevel,
  });

  await incrementBreachCount(task.id, { timestamp: now });
  await createTaskEvent({
    taskId: task.id,
    eventType: 'TASK_ESCALATED',
    payload: {
      from: currentLevel,
      to: targetLevel,
      minutesPastDue: diffMinutes,
    },
    actorType: 'system',
    origin: 'sla-scheduler',
  });

  publishTaskUpdated(updated);
  logger.warn('Escalated task due to SLA breach', {
    taskId: task.id,
    targetLevel,
    minutesPastDue: diffMinutes,
  });

  return { escalated: true, task: updated };
};

module.exports = {
  deriveSlaState,
  evaluateTaskSla,
};
