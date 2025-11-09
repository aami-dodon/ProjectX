const { createLogger } = require('@/utils/logger');
const {
  createValidationError,
  createNotFoundError,
} = require('@/utils/errors');
const {
  CONTROL_MAPPING_SET_SCHEMA,
} = require('./control.schemas');
const {
  findControlById,
  listFrameworkControlsByIds,
  listFrameworksByIds,
  recordControlAuditEvent,
  replaceFrameworkLinks,
} = require('./repositories/control.repository');

const logger = createLogger('governance-control-mapping-service');

const normalizeMappings = async (entries = []) => {
  const parsed = CONTROL_MAPPING_SET_SCHEMA.parse({
    frameworkMappings: entries,
  });

  const mappings = parsed.frameworkMappings.map((mapping) => ({ ...mapping }));
  const frameworkControlIds = Array.from(
    new Set(
      mappings
        .map((mapping) => mapping.frameworkControlId)
        .filter((value) => Boolean(value)),
    ),
  );
  const frameworkIds = Array.from(
    new Set(
      mappings.map((mapping) => mapping.frameworkId).filter((value) => Boolean(value)),
    ),
  );

  const [controls, frameworks] = await Promise.all([
    listFrameworkControlsByIds(frameworkControlIds),
    listFrameworksByIds(frameworkIds),
  ]);

  const controlMap = new Map(controls.map((entry) => [entry.id, entry]));
  const frameworkMap = new Map(frameworks.map((entry) => [entry.id, entry]));

  mappings.forEach((mapping) => {
    if (!mapping.frameworkControlId && !mapping.frameworkId) {
      throw createValidationError(
        'Each mapping must reference a framework requirement or framework identifier',
      );
    }

    if (mapping.frameworkControlId) {
      const controlRef = controlMap.get(mapping.frameworkControlId);
      if (!controlRef) {
        throw createValidationError('Framework requirement not found', {
          frameworkControlId: mapping.frameworkControlId,
        });
      }

      if (!mapping.frameworkId) {
        mapping.frameworkId = controlRef.frameworkId;
      }

      if (mapping.frameworkId && controlRef.frameworkId !== mapping.frameworkId) {
        throw createValidationError(
          'Framework control reference does not belong to specified framework',
          {
            frameworkControlId: mapping.frameworkControlId,
            frameworkId: mapping.frameworkId,
          },
        );
      }
    }

    if (mapping.frameworkId && !frameworkMap.has(mapping.frameworkId)) {
      throw createValidationError('Framework not found', {
        frameworkId: mapping.frameworkId,
      });
    }

    if (
      mapping.effectiveFrom &&
      mapping.effectiveTo &&
      mapping.effectiveFrom > mapping.effectiveTo
    ) {
      throw createValidationError('effectiveFrom must be before effectiveTo', {
        effectiveFrom: mapping.effectiveFrom,
        effectiveTo: mapping.effectiveTo,
      });
    }
  });

  return mappings;
};

const replaceControlMappings = async ({ controlId, mappings, actorId }) => {
  const control = await findControlById(controlId);
  if (!control) {
    throw createNotFoundError('Control not found', { controlId });
  }

  const normalizedMappings = await normalizeMappings(mappings ?? []);
  const record = await replaceFrameworkLinks({
    controlId,
    mappings: normalizedMappings,
  });

  await recordControlAuditEvent({
    controlId,
    actorId: actorId ?? null,
    action: 'CONTROL_MAPPINGS_REPLACED',
    changeSummary: 'Framework mappings updated',
    payloadAfter: normalizedMappings,
  });

  logger.info('Control mappings replaced', { controlId, actorId });
  return record;
};

module.exports = {
  replaceControlMappings,
};
