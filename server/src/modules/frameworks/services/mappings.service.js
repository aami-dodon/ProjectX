const { Prisma } = require('@prisma/client');
const { z } = require('zod');

const { createLogger } = require('@/utils/logger');
const {
  createNotFoundError,
  createValidationError,
} = require('@/utils/errors');
const {
  findFrameworkById,
  findFrameworksByIds,
} = require('../repositories/framework.repository');
const {
  findControlById,
  countControlsByFramework,
} = require('../repositories/control.repository');
const {
  listFrameworkMappings,
  countFrameworkMappings,
  groupMappingsByStrength,
  groupMappingsByTarget,
  createFrameworkMappingRecord,
  recordMappingHistoryEntry,
} = require('../repositories/mapping.repository');

const logger = createLogger('framework-mappings-service');

const LIST_SCHEMA = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
  targetFrameworkId: z.string().optional(),
  strength: z.array(z.string()).default([]),
});

const CREATE_SCHEMA = z.object({
  sourceControlId: z.string().min(1),
  targetControlId: z.string().min(1),
  mappingStrength: z.enum(['EXACT', 'PARTIAL', 'INFORMATIVE']).default('EXACT'),
  justification: z.string().max(4000).optional(),
  tags: z.array(z.string().min(1).max(64)).max(15).optional(),
  metadata: z.record(z.any()).optional(),
});

const parseListFilters = (params = {}) =>
  LIST_SCHEMA.parse({
    limit: params.limit,
    offset: params.offset,
    targetFrameworkId: params.targetFrameworkId ?? params.target,
    strength: params.strength
      ? Array.isArray(params.strength)
        ? params.strength
        : String(params.strength)
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean)
      : [],
  });

const serializeMapping = (record) => ({
  id: record.id,
  strength: record.mappingStrength,
  status: record.status,
  justification: record.justification ?? null,
  tags: record.tags ?? [],
  metadata: record.metadata ?? {},
  sourceControl: record.sourceControl
    ? {
        id: record.sourceControl.id,
        code: record.sourceControl.code,
        title: record.sourceControl.title,
      }
    : null,
  targetControl: record.targetControl
    ? {
        id: record.targetControl.id,
        code: record.targetControl.code,
        title: record.targetControl.title,
      }
    : null,
  targetFramework: record.targetFramework
    ? {
        id: record.targetFramework.id,
        title: record.targetFramework.title,
        slug: record.targetFramework.slug,
      }
    : {
        id: record.targetControl?.frameworkId ?? null,
      },
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const formatStrengthSummary = (groups = []) =>
  groups.reduce((acc, row) => {
    if (!row?.mappingStrength) {
      return acc;
    }
    acc[row.mappingStrength] = row._count?._all ?? 0;
    return acc;
  }, {});

const buildCoverageMatrix = async (frameworkId) => {
  const targetGroups = await groupMappingsByTarget(frameworkId);
  if (!targetGroups.length) {
    return [];
  }

  const targetFrameworkIds = Array.from(
    new Set(
      targetGroups.map((entry) => entry.targetFrameworkId).filter(Boolean),
    ),
  );

  const [frameworks, controlCounts] = await Promise.all([
    findFrameworksByIds(targetFrameworkIds),
    countControlsByFramework(targetFrameworkIds),
  ]);

  const frameworkMap = frameworks.reduce((acc, entry) => {
    acc.set(entry.id, entry);
    return acc;
  }, new Map());

  const grouped = targetFrameworkIds.map((targetId) => {
    const bucket = targetGroups.filter(
      (entry) => entry.targetFrameworkId === targetId,
    );

    const summary = bucket.reduce(
      (acc, entry) => {
        const strength = entry.mappingStrength ?? 'EXACT';
        const count = entry._count?._all ?? 0;
        acc[strength] = (acc[strength] ?? 0) + count;
        acc.total += count;
        return acc;
      },
      { EXACT: 0, PARTIAL: 0, INFORMATIVE: 0, total: 0 },
    );

    const targetFramework = frameworkMap.get(targetId);
    const targetControlCount = controlCounts.get(targetId) ?? 0;
    const coveragePercent = targetControlCount
      ? Math.min(100, Math.round((summary.total / targetControlCount) * 100))
      : 0;

    return {
      targetFrameworkId: targetId,
      targetFrameworkTitle: targetFramework?.title ?? 'Unknown Framework',
      exact: summary.EXACT,
      partial: summary.PARTIAL,
      informative: summary.INFORMATIVE,
      total: summary.total,
      coveragePercent,
    };
  });

  return grouped;
};

const listMappingsForFramework = async ({ frameworkId, params = {} }) => {
  if (!frameworkId) {
    throw createValidationError('frameworkId is required');
  }

  const framework = await findFrameworkById(frameworkId);
  if (!framework) {
    throw createNotFoundError('Framework not found');
  }

  const parsed = parseListFilters(params);

  const [records, total, strengthSummary, matrix] = await Promise.all([
    listFrameworkMappings({ frameworkId, ...parsed }),
    countFrameworkMappings({ frameworkId, ...parsed }),
    groupMappingsByStrength(frameworkId),
    buildCoverageMatrix(frameworkId),
  ]);

  return {
    data: records.map(serializeMapping),
    pagination: {
      total,
      limit: parsed.limit,
      offset: parsed.offset,
    },
    summary: {
      byStrength: formatStrengthSummary(strengthSummary),
    },
    matrix,
  };
};

const createFrameworkMapping = async ({
  frameworkId,
  payload,
  actorId,
}) => {
  if (!frameworkId) {
    throw createValidationError('frameworkId is required');
  }

  const framework = await findFrameworkById(frameworkId);
  if (!framework) {
    throw createNotFoundError('Framework not found');
  }

  const parsed = CREATE_SCHEMA.parse(payload ?? {});

  const [sourceControl, targetControl] = await Promise.all([
    findControlById(parsed.sourceControlId),
    findControlById(parsed.targetControlId),
  ]);

  if (!sourceControl || sourceControl.frameworkId !== frameworkId) {
    throw createValidationError('Source control must belong to the framework');
  }

  if (!targetControl) {
    throw createValidationError('Target control was not found');
  }

  try {
    const record = await createFrameworkMappingRecord({
      sourceFrameworkId: frameworkId,
      sourceControlId: parsed.sourceControlId,
      targetFrameworkId: targetControl.frameworkId,
      targetControlId: parsed.targetControlId,
      mappingStrength: parsed.mappingStrength,
      justification: parsed.justification ?? null,
      tags: parsed.tags ?? [],
      metadata: parsed.metadata ?? null,
    });

    await recordMappingHistoryEntry({
      mappingId: record.id,
      actorId,
      changeType: 'CREATED',
      payloadAfter: {
        mappingStrength: record.mappingStrength,
        justification: record.justification,
        tags: record.tags,
      },
    });

    return serializeMapping(record);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw createValidationError('Mapping already exists for these controls');
    }

    logger.error('Failed to create framework mapping', {
      error: error.message,
      frameworkId,
    });
    throw error;
  }
};

module.exports = {
  createFrameworkMapping,
  listMappingsForFramework,
};
