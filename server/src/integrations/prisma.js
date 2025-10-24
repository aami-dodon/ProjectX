const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const logLevels = ['info', 'query', 'warn', 'error'];
const configuredLogLevel = config.database.logLevel;

const prisma = new PrismaClient({
  log: logLevels.includes(configuredLogLevel) ? [configuredLogLevel] : ['error'],
});

module.exports = prisma;
