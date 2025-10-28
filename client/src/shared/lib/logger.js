const LEVEL_PRIORITIES = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const CONSOLE_METHODS = {
  error: "error",
  warn: "warn",
  info: "info",
  debug: "debug",
};

const sanitizeMeta = (meta = {}) =>
  Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined)
  );

const resolveLogLevel = () => {
  if (typeof import.meta !== "undefined") {
    const explicitLevel = import.meta.env?.VITE_LOG_LEVEL;
    if (
      explicitLevel &&
      Object.prototype.hasOwnProperty.call(LEVEL_PRIORITIES, explicitLevel)
    ) {
      return explicitLevel;
    }

    if (import.meta.env?.DEV) {
      return "debug";
    }
  }

  return "info";
};

const normalizeLogArguments = (args) => {
  if (!args.length) {
    return { message: "", meta: {} };
  }

  const [first, second, ...rest] = args;
  let message = "";
  let meta = {};

  if (typeof first === "string") {
    message = first;
    if (second && typeof second === "object") {
      meta = { ...second };
    }
  } else if (first && typeof first === "object") {
    meta = { ...first };
    if (typeof second === "string") {
      message = second;
    } else if (typeof first.message === "string") {
      message = first.message;
      delete meta.message;
    } else {
      message = JSON.stringify(first);
    }

    if (second && typeof second === "object") {
      meta = { ...meta, ...second };
    }
  } else {
    message = String(first);
  }

  if (rest.length) {
    rest.forEach((item) => {
      if (item && typeof item === "object") {
        meta = { ...meta, ...item };
      }
    });
  }

  return { message, meta };
};

const formatPayload = (level, message, meta = {}) => {
  const {
    requestId,
    traceId,
    module: moduleName,
    service,
    stack,
    ...rest
  } = meta;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (requestId !== undefined) {
    payload.requestId = requestId;
  }

  if (traceId !== undefined) {
    payload.traceId = traceId;
  }

  if (moduleName) {
    payload.module = moduleName;
  }

  if (service) {
    payload.service = service;
  }

  if (stack) {
    payload.stack = stack;
  }

  const metadata = sanitizeMeta(rest);
  if (Object.keys(metadata).length > 0) {
    payload.metadata = metadata;
  }

  return payload;
};

const shouldLog = (currentLevel, messageLevel) => {
  const currentPriority = LEVEL_PRIORITIES[currentLevel] ?? LEVEL_PRIORITIES.info;
  const messagePriority = LEVEL_PRIORITIES[messageLevel] ?? LEVEL_PRIORITIES.info;
  return messagePriority <= currentPriority;
};

const emitLog = (level, payload) => {
  const consoleMethod = CONSOLE_METHODS[level] ?? "log";
  if (typeof console[consoleMethod] === "function") {
    console[consoleMethod](JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
};

const createLoggerInstance = (defaultMeta = {}) => {
  const level = resolveLogLevel();

  const logWithLevel = (severity, parameters) => {
    if (!shouldLog(level, severity)) {
      return;
    }

    const { message, meta } = normalizeLogArguments(parameters);
    const combinedMeta = { ...defaultMeta, ...meta };
    const payload = formatPayload(severity, message, combinedMeta);
    emitLog(severity, payload);
  };

  return {
    child: (meta = {}) => createLoggerInstance({ ...defaultMeta, ...meta }),
    debug: (...parameters) => logWithLevel("debug", parameters),
    info: (...parameters) => logWithLevel("info", parameters),
    warn: (...parameters) => logWithLevel("warn", parameters),
    error: (...parameters) => logWithLevel("error", parameters),
    log: (levelOrPayload, ...parameters) => {
      if (typeof levelOrPayload === "string") {
        logWithLevel(levelOrPayload, parameters);
        return;
      }

      if (levelOrPayload && typeof levelOrPayload === "object") {
        const { level: payloadLevel = "info", message, ...meta } = levelOrPayload;
        logWithLevel(payloadLevel, [meta, message, ...parameters]);
      }
    },
  };
};

const baseLogger = createLoggerInstance({ service: "project-x-client" });

const createLogger = (moduleName) => baseLogger.child({ module: moduleName });

export { baseLogger, createLogger };
