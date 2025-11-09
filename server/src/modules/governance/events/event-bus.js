const { EventEmitter } = require('node:events');

const governanceEventBus = new EventEmitter();

module.exports = {
  governanceEventBus,
};
