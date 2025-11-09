const { prisma } = require('@/integrations/prisma');

const listFrameworkVersions = async (frameworkId, { limit } = {}) =>
  prisma.frameworkVersion.findMany({
    where: { frameworkId },
    orderBy: { createdAt: 'desc' },
    take: limit ?? undefined,
  });

const createFrameworkVersionRecord = async ({
  frameworkId,
  payload,
}) =>
  prisma.frameworkVersion.create({
    data: {
      frameworkId,
      version: payload.version,
      status: payload.status ?? 'DRAFT',
      changelog: payload.changelog ?? null,
      diffHash: payload.diffHash ?? null,
      diffSummary: payload.diffSummary ?? null,
      approvals: payload.approvals ?? null,
      metadata: payload.metadata ?? null,
      effectiveFrom: payload.effectiveFrom ?? null,
      effectiveTo: payload.effectiveTo ?? null,
      publishedAt: payload.publishedAt ?? null,
    },
  });

const findVersionById = async (versionId) =>
  prisma.frameworkVersion.findUnique({
    where: { id: versionId },
  });

const setActiveVersion = async (frameworkId, versionId) =>
  prisma.framework.update({
    where: { id: frameworkId },
    data: {
      activeVersionId: versionId,
    },
  });

module.exports = {
  createFrameworkVersionRecord,
  findVersionById,
  listFrameworkVersions,
  setActiveVersion,
};
