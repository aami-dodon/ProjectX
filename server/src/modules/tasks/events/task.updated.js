const { createLogger } = require('@/utils/logger');
const { taskEventBus } = require('./event-bus');

const logger = createLogger('task-updated-event');

const publishTaskUpdated = (task) => {
  if (!task?.id) {
    return;
  }

  taskEventBus.emit('tasks.updated.v1', {
    taskId: task.id,
    status: task.status,
    escalationLevel: task.escalationLevel ?? 0,
  });

  logger.debug('Emitted task.updated event', {
    taskId: task.id,
    status: task.status,
  });
};

module.exports = {
  publishTaskUpdated,
};
