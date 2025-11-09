const { createValidationError, createNotFoundError } = require('@/utils/errors');
const { prisma } = require('@/integrations/prisma');
const { attachEvidenceLinks, createTaskEvent, findTaskById } = require('../repositories/task.repository');

const validateEvidenceRecords = async (evidenceIds = []) => {
  if (!Array.isArray(evidenceIds) || evidenceIds.length === 0) {
    throw createValidationError('At least one evidenceId is required');
  }

  const uniqueIds = [...new Set(evidenceIds.filter(Boolean))];
  const records = await prisma.evidence.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, displayName: true },
  });

  if (records.length !== uniqueIds.length) {
    const foundIds = new Set(records.map((record) => record.id));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));
    throw createNotFoundError('Some evidence records were not found', { missing });
  }

  return records;
};

const linkEvidenceToTask = async ({
  taskId,
  evidenceIds,
  linkType,
  actorId,
}) => {
  if (!taskId) {
    throw createValidationError('taskId is required to link evidence');
  }

  const evidenceRecords = await validateEvidenceRecords(evidenceIds);
  const evidenceLinks = await attachEvidenceLinks({
    taskId,
    links: evidenceRecords.map((record) => ({
      evidenceId: record.id,
      linkType: linkType ?? 'ATTACHMENT',
    })),
  });

  await createTaskEvent({
    taskId,
    eventType: 'TASK_EVIDENCE_LINKED',
    actorId: actorId ?? null,
    payload: {
      evidenceIds: evidenceRecords.map((record) => record.id),
    },
  });

  const task = await findTaskById(taskId);
  return {
    task,
    evidence: evidenceLinks,
  };
};

module.exports = {
  linkEvidenceToTask,
};
