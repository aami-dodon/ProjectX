const { createLogger } = require('@/utils/logger');
const { taskEventBus } = require('./event-bus');

const logger = createLogger('task-created-event');

const publishTaskCreated = (task) => {
  if (!task?.id) {
    return;
  }

  taskEventBus.emit('tasks.created.v1', {
    taskId: task.id,
    status: task.status,
    priority: task.priority,
  });

  logger.info('Emitted task.created event', { taskId: task.id });
};

module.exports = {
  publishTaskCreated,
};
