const defaultState = {
  status: 'unknown',
  latencyMs: null,
  environment: {},
  uptime: {},
  api: {},
  database: {},
  minio: {},
  email: {},
  dns: { records: [] },
  cors: {},
  redis: {},
  queues: [],
  system: {},
};

export const formatHealthData = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { ...defaultState };
  }

  return {
    ...defaultState,
    ...payload,
    environment: { ...defaultState.environment, ...payload.environment },
    uptime: { ...defaultState.uptime, ...payload.uptime },
    api: { ...defaultState.api, ...payload.api },
    database: { ...defaultState.database, ...payload.database },
    minio: { ...defaultState.minio, ...payload.minio },
    email: { ...defaultState.email, ...payload.email },
    dns: {
      ...defaultState.dns,
      ...(payload.dns || {}),
      records: Array.isArray(payload?.dns?.records) ? payload.dns.records : defaultState.dns.records,
    },
    cors: { ...defaultState.cors, ...payload.cors },
    redis: { ...defaultState.redis, ...payload.redis },
    system: { ...defaultState.system, ...payload.system },
    queues: Array.isArray(payload?.queues) ? payload.queues : defaultState.queues,
  };
};

export default formatHealthData;
