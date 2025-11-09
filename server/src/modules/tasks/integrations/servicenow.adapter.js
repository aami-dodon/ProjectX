const { createLogger } = require('@/utils/logger');

const logger = createLogger('tasks-servicenow-adapter');

const syncTask = async ({ task, payload, externalIssueKey }) => {
  const incidentNumber = externalIssueKey ?? `INC${task.id.slice(0, 6).toUpperCase()}`;
  logger.info('Simulating ServiceNow sync', {
    taskId: task.id,
    incidentNumber,
    payload,
  });

  return {
    provider: 'servicenow',
    issueKey: incidentNumber,
    status: 'synced',
  };
};

module.exports = {
  syncTask,
};
