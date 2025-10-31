const fs = require('fs');
const path = require('path');
const { createLogger: createWinstonLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const resolveLogLevel = () => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  return process.env.NODE_ENV === 'development' ? 'debug' : 'info';
};

// Base JSON format (for production/file logs)
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

// Dynamic transports (based on NODE_ENV)
let transportsList = [];

if (process.env.NODE_ENV === 'development') {
  // 🟢 Development: Colorized human-readable console output
  transportsList.push(
    new transports.Console({
      handleExceptions: true,
      format: format.combine(
        format.colorize({ all: true }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message, stack }) => {
          return stack
            ? `${timestamp} ${level}: ${message}\n${stack}`
            : `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
} else {
  // 🟤 Production: Structured JSON for ingestion + rotating file
  transportsList.push(
    new transports.Console({
      handleExceptions: true,
      format: format.combine(format.timestamp(), format.json()),
    }),
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'project-x-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      handleExceptions: true,
      format: baseFormat,
    })
  );
}

// Silence logs during tests
if (process.env.NODE_ENV === 'test') {
  transportsList.forEach((t) => (t.silent = true));
}

// Create Winston logger
const baseLoggerInstance = createWinstonLogger({
  level: resolveLogLevel(),
  format: baseFormat,
  defaultMeta: { service: 'project-x-server' },
  transports: transportsList,
  exitOnError: false,
});

// Normalizes log arguments (message + meta)
const normalizeLogArguments = (args) => {
  if (args.length === 0) return { message: '', meta: {} };

  const [first, second, ...rest] = args;
  let message;
  let meta = {};

  if (typeof first === 'string') {
    message = first;
    if (second && typeof second === 'object') meta = { ...second };
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

// Wrap Winston logger with simplified interface
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
