const { prisma } = require('@/integrations/prisma');

const normalizeArray = (value) => {
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

const buildWhereClause = ({ frameworkId, search, categories, statuses } = {}) => {
  const where = {
    frameworkId,
  };

  const normalizedCategories = normalizeArray(categories);
  if (normalizedCategories.length > 0) {
    where.category = { in: normalizedCategories };
  }

  const normalizedStatuses = normalizeArray(statuses).map((status) =>
    status.toUpperCase(),
  );
  if (normalizedStatuses.length > 0) {
    where.status = { in: normalizedStatuses };
  }

  if (typeof search === 'string' && search.trim()) {
    const query = search.trim();
    where.OR = [
      { code: { contains: query, mode: 'insensitive' } },
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }

  return where;
};

const listFrameworkControls = async (params = {}) =>
  prisma.frameworkControl.findMany({
    where: buildWhereClause(params),
    orderBy: [{ status: 'asc' }, { code: 'asc' }],
  });

const createFrameworkControlRecord = async ({
  frameworkId,
  payload,
}) => {
  return prisma.frameworkControl.create({
    data: {
      frameworkId,
      frameworkVersionId: payload.frameworkVersionId ?? null,
      code: payload.code,
      title: payload.title,
      description: payload.description ?? null,
      category: payload.category ?? null,
      riskLevel: payload.riskLevel ?? null,
      status: payload.status ?? 'DRAFT',
      tags: payload.tags ?? [],
      evidenceRequirements: payload.evidenceRequirements ?? null,
      metadata: payload.metadata ?? null,
    },
  });
};

const countControlsByFramework = async (frameworkIds = []) => {
  if (!Array.isArray(frameworkIds) || frameworkIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.frameworkControl.groupBy({
    by: ['frameworkId'],
    where: {
      frameworkId: { in: frameworkIds },
    },
    _count: {
      _all: true,
    },
  });

  return new Map(rows.map((row) => [row.frameworkId, row._count?._all ?? 0]));
};

const findControlById = async (controlId) =>
  prisma.frameworkControl.findUnique({
    where: { id: controlId },
  });

module.exports = {
  countControlsByFramework,
  createFrameworkControlRecord,
  findControlById,
  listFrameworkControls,
};
