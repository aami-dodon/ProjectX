const { z } = require('zod');

const {
  createNotFoundError,
  createValidationError,
} = require('@/utils/errors');
const {
  findFrameworkById,
} = require('../repositories/framework.repository');
const {
  listFrameworkVersions,
  createFrameworkVersionRecord,
  setActiveVersion,
} = require('../repositories/version.repository');

const VERSION_SCHEMA = z.object({
  version: z.string().min(1).max(50),
  status: z
    .enum(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'RETIRED'])
    .default('DRAFT'),
  changelog: z.string().max(4000).optional(),
  diffSummary: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
});

const serializeVersion = (record) => ({
  id: record.id,
  version: record.version,
  status: record.status,
  changelog: record.changelog ?? null,
  diffSummary: record.diffSummary ?? {},
  metadata: record.metadata ?? {},
  effectiveFrom: record.effectiveFrom,
  effectiveTo: record.effectiveTo,
  publishedAt: record.publishedAt,
  createdAt: record.createdAt,
});

const listVersionsForFramework = async (frameworkId) => {
  if (!frameworkId) {
    throw createValidationError('frameworkId is required');
  }

  const framework = await findFrameworkById(frameworkId);
  if (!framework) {
    throw createNotFoundError('Framework not found');
  }

  const records = await listFrameworkVersions(frameworkId);
  return records.map(serializeVersion);
};

const createFrameworkVersion = async ({ frameworkId, payload }) => {
  if (!frameworkId) {
    throw createValidationError('frameworkId is required');
  }

  const framework = await findFrameworkById(frameworkId);
  if (!framework) {
    throw createNotFoundError('Framework not found');
  }

  const parsed = VERSION_SCHEMA.parse(payload ?? {});

  const record = await createFrameworkVersionRecord({
    frameworkId,
    payload: parsed,
  });

  if (record.status === 'PUBLISHED') {
    await setActiveVersion(frameworkId, record.id);
  }

  return serializeVersion(record);
};

module.exports = {
  createFrameworkVersion,
  listVersionsForFramework,
};
