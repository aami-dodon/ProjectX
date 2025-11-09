const { z } = require('zod');

const {
  createNotFoundError,
  createValidationError,
} = require('@/utils/errors');
const {
  findFrameworkById,
} = require('../repositories/framework.repository');
const {
  createFrameworkControlRecord,
  listFrameworkControls,
} = require('../repositories/control.repository');

const CONTROL_SCHEMA = z.object({
  code: z.string().min(1).max(64),
  title: z.string().min(3).max(255),
  description: z.string().max(4000).optional(),
  category: z.string().max(255).optional(),
  riskLevel: z.string().max(255).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'RETIRED']).default('DRAFT'),
  tags: z.array(z.string().min(1).max(64)).max(25).optional(),
  evidenceRequirements: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

const FILTER_SCHEMA = z.object({
  search: z.string().optional(),
  categories: z.array(z.string()).default([]),
  statuses: z.array(z.string()).default([]),
});

const serializeControl = (control) => ({
  id: control.id,
  code: control.code,
  title: control.title,
  description: control.description ?? null,
  category: control.category ?? null,
  riskLevel: control.riskLevel ?? null,
  status: control.status,
  tags: control.tags ?? [],
  evidenceRequirements: control.evidenceRequirements ?? null,
  metadata: control.metadata ?? {},
  createdAt: control.createdAt,
  updatedAt: control.updatedAt,
});

const listControlsForFramework = async ({ frameworkId, filters = {} }) => {
  if (!frameworkId) {
    throw createValidationError('frameworkId is required');
  }

  const parsedFilters = FILTER_SCHEMA.parse({
    search: filters.search,
    categories: filters.category ? [filters.category] : filters.categories,
    statuses: filters.status ? [filters.status] : filters.statuses,
  });

  const controls = await listFrameworkControls({
    frameworkId,
    ...parsedFilters,
  });

  return controls.map(serializeControl);
};

const createFrameworkControl = async ({ frameworkId, payload }) => {
  if (!frameworkId) {
    throw createValidationError('frameworkId is required');
  }

  const framework = await findFrameworkById(frameworkId);
  if (!framework) {
    throw createNotFoundError('Framework not found');
  }

  const parsed = CONTROL_SCHEMA.parse(payload ?? {});

  const record = await createFrameworkControlRecord({
    frameworkId,
    payload: parsed,
  });

  return serializeControl(record);
};

module.exports = {
  createFrameworkControl,
  listControlsForFramework,
};
