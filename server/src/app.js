const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const requestContext = require('./middleware/requestContext');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { createNotFoundError } = require(path.resolve(
  __dirname,
  '../..',
  'shared',
  'error-handling'
));

const app = express();

app.use(requestContext);
app.use(cors({ origin: [config.server.clientUrl], credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Project X API' });
});

app.use(config.server.apiPrefix, routes);

app.use((req, res, next) => {
  next(
    createNotFoundError('Route not found', {
      path: req.originalUrl,
      method: req.method,
    })
  );
});

app.use(errorHandler);

app.on('ready', () => {
  logger.info('API application initialised');
});

module.exports = app;
