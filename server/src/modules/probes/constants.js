const PROBE_STATUSES = ['draft', 'active', 'deprecated'];
const PROBE_DEPLOYMENT_STATUSES = ['pending', 'in_progress', 'completed', 'failed', 'rolled_back', 'cancelled'];
const PROBE_SCHEDULE_TYPES = ['cron', 'event', 'adhoc'];
const PROBE_SCHEDULE_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const PROBE_SCHEDULE_STATUSES = ['active', 'paused', 'disabled'];
const PROBE_HEARTBEAT_STATUSES = ['operational', 'degraded', 'outage', 'unknown'];

const DEFAULT_PAGE_LIMIT = 25;
const MAX_PAGE_LIMIT = 100;

module.exports = {
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  PROBE_DEPLOYMENT_STATUSES,
  PROBE_HEARTBEAT_STATUSES,
  PROBE_SCHEDULE_PRIORITIES,
  PROBE_SCHEDULE_STATUSES,
  PROBE_SCHEDULE_TYPES,
  PROBE_STATUSES,
};
