const { EventEmitter } = require('node:events');

const taskEventBus = new EventEmitter();
taskEventBus.setMaxListeners(50);

module.exports = {
  taskEventBus,
};
