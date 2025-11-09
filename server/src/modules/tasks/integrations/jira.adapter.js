const { createLogger } = require('@/utils/logger');

const logger = createLogger('tasks-jira-adapter');

const syncTask = async ({ task, payload, externalIssueKey }) => {
  const issueKey = externalIssueKey ?? `TASK-${task.id.slice(0, 8).toUpperCase()}`;
  logger.info('Simulating Jira sync', {
    taskId: task.id,
    issueKey,
    payload,
  });

  return {
    provider: 'jira',
    issueKey,
    status: 'synced',
  };
};

module.exports = {
  syncTask,
};
