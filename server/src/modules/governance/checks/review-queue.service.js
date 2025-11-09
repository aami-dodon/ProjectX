const { z } = require('zod');

const {
  listReviewQueueItems,
  countReviewQueueItems,
} = require('../repositories/review-queue.repository');

const LIST_SCHEMA = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  states: z.array(z.string()).default([]),
  priorities: z.array(z.string()).default([]),
  assignedTo: z.string().optional(),
  checkIds: z.array(z.string()).default([]),
  sort: z.string().optional(),
});

const normalizeList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const serializeQueueItem = (item) => ({
  id: item.id,
  checkId: item.checkId,
  resultId: item.resultId,
  state: item.state,
  priority: item.priority,
  assignedTo: item.assignedTo ?? null,
  dueAt: item.dueAt,
  metadata: item.metadata ?? {},
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  check: item.check
    ? {
        id: item.check.id,
        name: item.check.name,
        severityDefault: item.check.severityDefault,
        type: item.check.type,
      }
    : null,
  result: item.result
    ? {
        id: item.result.id,
        status: item.result.status,
        severity: item.result.severity,
        executedAt: item.result.executedAt,
      }
    : null,
});

const listReviewQueue = async (params = {}) => {
  const parsed = LIST_SCHEMA.parse({
    ...params,
    states: normalizeList(params.state ?? params.states),
    priorities: normalizeList(params.priority ?? params.priorities),
    checkIds: normalizeList(params.checkId ?? params.checkIds),
  });

  const [items, total] = await Promise.all([
    listReviewQueueItems(parsed),
    countReviewQueueItems(parsed),
  ]);

  const groupedByState = items.reduce((acc, item) => {
    acc[item.state] = (acc[item.state] ?? 0) + 1;
    return acc;
  }, {});

  return {
    data: items.map(serializeQueueItem),
    pagination: {
      total,
      limit: parsed.limit,
      offset: parsed.offset,
    },
    summary: {
      states: groupedByState,
    },
  };
};

module.exports = {
  listReviewQueue,
  serializeQueueItem,
};
