const { createLogger } = require('@/utils/logger');
const { findTaskById } = require('../repositories/task.repository');
const jiraAdapter = require('../integrations/jira.adapter');
const servicenowAdapter = require('../integrations/servicenow.adapter');

const logger = createLogger('tasks-sync-processor');

const PROVIDER_ADAPTERS = {
  jira: jiraAdapter,
  servicenow: servicenowAdapter,
};

const syncQueue = [];
let processing = false;

const enqueueSyncRequest = async ({ taskId, provider, actorId, payload, externalIssueKey }) => {
  if (!taskId || !provider) {
    return { queued: false };
  }

  syncQueue.push({
    taskId,
    provider: provider.toLowerCase(),
    actorId: actorId ?? null,
    payload: payload ?? {},
    externalIssueKey: externalIssueKey ?? null,
    enqueuedAt: new Date(),
  });

  logger.debug('Queued external sync', { taskId, provider, queueDepth: syncQueue.length });
  if (!processing) {
    processSyncQueue().catch((error) => {
      logger.error('Failed to auto-run sync queue', { error: error.message });
    });
  }

  return { queued: true };
};

const processSyncQueue = async () => {
  if (processing) {
    return;
  }

  processing = true;
  try {
    while (syncQueue.length > 0) {
      const job = syncQueue.shift();
      const adapter = PROVIDER_ADAPTERS[job.provider];
      if (!adapter) {
        logger.warn('No adapter registered for provider', { provider: job.provider });
        continue;
      }

      try {
        const task = await findTaskById(job.taskId);
        if (!task) {
          logger.warn('Skipping sync for missing task', { taskId: job.taskId });
          continue;
        }

        await adapter.syncTask({
          task,
          payload: job.payload,
          externalIssueKey: job.externalIssueKey,
          actorId: job.actorId,
        });
      } catch (error) {
        logger.error('Task sync job failed', {
          taskId: job.taskId,
          provider: job.provider,
          error: error.message,
        });
      }
    }
  } finally {
    processing = false;
  }
};

module.exports = {
  enqueueSyncRequest,
  processSyncQueue,
};
