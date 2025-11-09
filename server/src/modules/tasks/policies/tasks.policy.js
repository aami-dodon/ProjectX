const TASK_RESOURCES = {
  RECORDS: 'tasks:records',
  ASSIGNMENTS: 'tasks:assignments',
  EVIDENCE: 'tasks:evidence',
  VERIFICATION: 'tasks:verification',
  METRICS: 'tasks:metrics',
  INTEGRATIONS: 'tasks:integrations',
};

const DEFAULT_TASK_POLICIES = [
  { subject: 'admin', domain: 'global', object: TASK_RESOURCES.RECORDS, action: 'read' },
  { subject: 'admin', domain: 'global', object: TASK_RESOURCES.RECORDS, action: 'create' },
  { subject: 'admin', domain: 'global', object: TASK_RESOURCES.RECORDS, action: 'update' },
  { subject: 'admin', domain: 'global', object: TASK_RESOURCES.ASSIGNMENTS, action: 'update' },
  { subject: 'admin', domain: 'global', object: TASK_RESOURCES.EVIDENCE, action: 'update' },
  { subject: 'admin', domain: 'global', object: TASK_RESOURCES.METRICS, action: 'read' },
  { subject: 'admin', domain: 'global', object: TASK_RESOURCES.INTEGRATIONS, action: 'sync' },
];

module.exports = {
  DEFAULT_TASK_POLICIES,
  TASK_RESOURCES,
};
