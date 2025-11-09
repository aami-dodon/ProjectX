const { createLogger } = require('@/utils/logger');
const { taskEventBus } = require('./event-bus');

const logger = createLogger('task-closed-event');

const publishTaskClosed = (task) => {
  if (!task?.id) {
    return;
  }

  taskEventBus.emit('tasks.closed.v1', {
    taskId: task.id,
    closedAt: task.closedAt ?? new Date(),
  });

  logger.info('Emitted task.closed event', { taskId: task.id });
};

module.exports = {
  publishTaskClosed,
};
