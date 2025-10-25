const fs = require('fs');
const path = require('path');
const { createLogger: createWinstonLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const resolveLogLevel = () => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  return process.env.NODE_ENV === 'development' ? 'debug' : 'info';
};

const baseFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const payload = {
      timestamp,
      level,
      message,
    };

    if (meta.context && typeof meta.context === 'object') {
      const { requestId: contextRequestId, traceId: contextTraceId } = meta.context;
      if (contextRequestId !== undefined && meta.requestId === undefined) {
        payload.requestId = contextRequestId;
      }
      if (contextTraceId !== undefined && meta.traceId === undefined) {
        payload.traceId = contextTraceId;
      }
      delete meta.context;
    }

    if (meta.requestId !== undefined) {
      payload.requestId = meta.requestId;
      delete meta.requestId;
    }

    if (meta.traceId !== undefined) {
      payload.traceId = meta.traceId;
      delete meta.traceId;
    }

    if (meta.module) {
      payload.module = meta.module;
      delete meta.module;
    }

    if (meta.service) {
      payload.service = meta.service;
      delete meta.service;
    }

    if (meta.stack) {
      payload.stack = meta.stack;
      delete meta.stack;
    }

    const metadata = Object.fromEntries(
      Object.entries(meta).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(metadata).length > 0) {
      payload.metadata = metadata;
    }

    return JSON.stringify(payload);
  })
);

const transportsList = [
  new transports.Console({ handleExceptions: true }),
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'project-x-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    maxSize: '20m',
    handleExceptions: true,
  }),
];

if (process.env.NODE_ENV === 'test') {
  transportsList.forEach((transportInstance) => {
    // Silence log output during automated tests
    // eslint-disable-next-line no-param-reassign
    transportInstance.silent = true;
  });
}

const baseLoggerInstance = createWinstonLogger({
  level: resolveLogLevel(),
  format: baseFormat,
  defaultMeta: { service: 'project-x-server' },
  transports: transportsList,
  exitOnError: false,
});

const normalizeLogArguments = (args) => {
  if (args.length === 0) {
    return { message: '', meta: {} };
  }

  const [first, second, ...rest] = args;
  let message;
  let meta = {};

  if (typeof first === 'string') {
    message = first;
    if (second && typeof second === 'object') {
      meta = { ...second };
    }
  } else if (first && typeof first === 'object') {
    meta = { ...first };
    if (typeof second === 'string') {
      message = second;
    } else if (typeof first.message === 'string') {
      message = first.message;
      delete meta.message;
    } else {
      message = JSON.stringify(first);
    }

    if (second && typeof second === 'object') {
      meta = { ...meta, ...second };
    }
  } else {
    message = String(first);
  }

  if (rest.length > 0) {
    rest.forEach((item) => {
      if (item && typeof item === 'object') {
        meta = { ...meta, ...item };
      }
    });
  }

  return { message, meta };
};

const wrapLogger = (loggerInstance) => {
  const logWithLevel = (level, parameters) => {
    const { message, meta } = normalizeLogArguments(parameters);
    loggerInstance.log({ level, message, ...meta });
  };

  return {
    child: (meta = {}) => wrapLogger(loggerInstance.child(meta)),
    debug: (...parameters) => logWithLevel('debug', parameters),
    info: (...parameters) => logWithLevel('info', parameters),
    warn: (...parameters) => logWithLevel('warn', parameters),
    error: (...parameters) => logWithLevel('error', parameters),
    log: (levelOrPayload, ...parameters) => {
      if (typeof levelOrPayload === 'string') {
        logWithLevel(levelOrPayload, parameters);
        return;
      }

      if (levelOrPayload && typeof levelOrPayload === 'object') {
        loggerInstance.log(levelOrPayload);
      }
    },
  };
};

const baseLogger = wrapLogger(baseLoggerInstance);

const createLogger = (moduleName) => baseLogger.child({ module: moduleName });

module.exports = {
  baseLogger,
  createLogger,
};

