const { EventEmitter } = require('node:events');

const probeEventBus = new EventEmitter();

module.exports = {
  probeEventBus,
};
