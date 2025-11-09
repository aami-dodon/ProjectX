const { z } = require('zod');

const {
  createNotFoundError,
  createValidationError,
} = require('@/utils/errors');
const {
  aggregateFrameworkRecords,
  countFrameworkRecords,
  createFrameworkRecord,
  findFrameworkById,
  listFrameworkRecords,
  updateFrameworkRecord,
} = require('../repositories/framework.repository');
const {
  countControlsByFramework,
} = require('../repositories/control.repository');
const {
  countMappingsByFramework,
} = require('../repositories/mapping.repository');
const {
  listFrameworkVersions,
} = require('../repositories/version.repository');

const normalizeMultiValue = (value) => {
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

const LIST_SCHEMA = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
  statuses: z.array(z.string()).default([]),
  jurisdictions: z.array(z.string()).default([]),
  publishers: z.array(z.string()).default([]),
  domains: z.array(z.string()).default([]),
  sort: z.string().optional(),
});

const BASE_FRAMEWORK_SCHEMA = z.object({
  slug: z
    .string()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9-]+$/i, 'Slug must be alphanumeric and may include hyphens'),
  title: z.string().min(3).max(255),
  description: z.string().max(4000).optional(),
  domain: z.string().max(255).optional(),
  jurisdiction: z.string().max(255).optional(),
  publisher: z.string().max(255).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'RETIRED']).default('DRAFT'),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional(),
  tags: z.array(z.string().min(1).max(64)).max(20).optional(),
  metadata: z.record(z.any()).optional(),
  version: z.string().min(1).max(50).optional(),
  changelog: z.string().max(4000).optional(),
});

const UPDATE_FRAMEWORK_SCHEMA = BASE_FRAMEWORK_SCHEMA.partial();

const parseListParams = (params = {}) =>
  LIST_SCHEMA.parse({
    limit: params.limit,
    offset: params.offset,
    search: params.search,
    sort: params.sort,
    statuses: normalizeMultiValue(params.status ?? params.statuses),
    jurisdictions: normalizeMultiValue(
      params.jurisdiction ?? params.jurisdictions,
    ),
    publishers: normalizeMultiValue(params.publisher ?? params.publishers),
    domains: normalizeMultiValue(params.domain ?? params.domains),
  });

const serializeFramework = (record, { controlCounts, mappingCounts } = {}) => {
  const controls = controlCounts?.get(record.id) ?? record._count?.controls ?? 0;
  const mappings =
    mappingCounts?.get(record.id) ?? record._count?.sourceMappings ?? 0;
  const coveragePercent = controls
    ? Math.min(100, Math.round((mappings / controls) * 100))
    : 0;

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description ?? null,
    domain: record.domain ?? null,
    jurisdiction: record.jurisdiction ?? null,
    publisher: record.publisher ?? null,
    status: record.status,
    validFrom: record.validFrom,
    validTo: record.validTo,
    tags: record.tags ?? [],
    metadata: record.metadata ?? {},
    activeVersion: record.activeVersion
      ? {
          id: record.activeVersion.id,
          version: record.activeVersion.version,
          status: record.activeVersion.status,
          publishedAt: record.activeVersion.publishedAt,
        }
      : null,
    stats: {
      controls,
      mappings,
      coveragePercent,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

const formatAggregate = (groups = [], label = 'value') =>
  groups.reduce((acc, group) => {
    if (!group || !group[label]) {
      return acc;
    }
    const key = group[label];
    const count = group?._count?._all ?? 0;
    acc[key] = count;
    return acc;
  }, {});

const extractFrameworkData = (payload) => ({
  slug: payload.slug.toLowerCase(),
  title: payload.title,
  description: payload.description ?? null,
  domain: payload.domain ?? null,
  jurisdiction: payload.jurisdiction ?? null,
  publisher: payload.publisher ?? null,
  status: payload.status ?? 'DRAFT',
  validFrom: payload.validFrom ?? null,
  validTo: payload.validTo ?? null,
  tags: payload.tags ?? [],
  metadata: payload.metadata ?? null,
});

const listFrameworks = async (params = {}) => {
  const parsed = parseListParams(params);

  const [records, total, aggregates] = await Promise.all([
    listFrameworkRecords(parsed),
    countFrameworkRecords(parsed),
    aggregateFrameworkRecords(),
  ]);

  const frameworkIds = records.map((record) => record.id);
  const [controlCounts, mappingCounts] = await Promise.all([
    countControlsByFramework(frameworkIds),
    countMappingsByFramework(frameworkIds),
  ]);

  return {
    data: records.map((record) =>
      serializeFramework(record, { controlCounts, mappingCounts }),
    ),
    pagination: {
      total,
      limit: parsed.limit,
      offset: parsed.offset,
    },
    summary: {
      status: formatAggregate(aggregates.status, 'status'),
      jurisdiction: formatAggregate(aggregates.jurisdiction, 'jurisdiction'),
      publisher: formatAggregate(aggregates.publisher, 'publisher'),
    },
  };
};

const createFrameworkDefinition = async ({ payload }) => {
  const parsed = BASE_FRAMEWORK_SCHEMA.parse(payload ?? {});

  const record = await createFrameworkRecord({
    frameworkData: extractFrameworkData(parsed),
    versionData: {
      version: parsed.version ?? '1.0.0',
      changelog: parsed.changelog ?? null,
      status: parsed.status === 'ACTIVE' ? 'PUBLISHED' : 'DRAFT',
    },
  });

  return serializeFramework(record, {
    controlCounts: new Map([[record.id, 0]]),
    mappingCounts: new Map([[record.id, 0]]),
  });
};

const updateFrameworkDefinition = async ({ frameworkId, payload }) => {
  if (!frameworkId) {
    throw createValidationError('frameworkId is required');
  }

  const parsed = UPDATE_FRAMEWORK_SCHEMA.parse(payload ?? {});

  const existing = await findFrameworkById(frameworkId);
  if (!existing) {
    throw createNotFoundError('Framework not found');
  }

  const updated = await updateFrameworkRecord(
    frameworkId,
    extractFrameworkData({
      ...existing,
      ...parsed,
      slug: parsed.slug ?? existing.slug,
    }),
  );

  const [controlCounts, mappingCounts] = await Promise.all([
    countControlsByFramework([frameworkId]),
    countMappingsByFramework([frameworkId]),
  ]);

  return serializeFramework(updated, {
    controlCounts,
    mappingCounts,
  });
};

const serializeVersionSummary = (version) => ({
  id: version.id,
  version: version.version,
  status: version.status,
  changelog: version.changelog ?? null,
  diffSummary: version.diffSummary ?? {},
  publishedAt: version.publishedAt,
  createdAt: version.createdAt,
});

const getFrameworkDetail = async ({ frameworkId }) => {
  if (!frameworkId) {
    throw createValidationError('frameworkId is required');
  }

  const record = await findFrameworkById(frameworkId);
  if (!record) {
    throw createNotFoundError('Framework not found');
  }

  const [controlCounts, mappingCounts, versions] = await Promise.all([
    countControlsByFramework([frameworkId]),
    countMappingsByFramework([frameworkId]),
    listFrameworkVersions(frameworkId, { limit: 5 }),
  ]);

  return {
    data: serializeFramework(record, { controlCounts, mappingCounts }),
    timeline: versions.map(serializeVersionSummary),
  };
};

module.exports = {
  createFrameworkDefinition,
  getFrameworkDetail,
  listFrameworks,
  updateFrameworkDefinition,
};
