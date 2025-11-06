const { prisma } = require('@/integrations/prisma');

const buildPolicyWhere = ({ domain, subject, includeDeleted = false, type } = {}) => ({
  ...(domain ? { domain } : {}),
  ...(subject ? { subject } : {}),
  ...(type ? { type } : {}),
  ...(includeDeleted ? {} : { deletedAt: null }),
});

const listPolicies = async (filters = {}) =>
  prisma.authPolicy.findMany({
    where: buildPolicyWhere(filters),
    orderBy: [{ domain: 'asc' }, { subject: 'asc' }, { object: 'asc' }],
  });

const findPolicyById = async (id) =>
  prisma.authPolicy.findUnique({
    where: { id },
  });

const createPolicy = async ({
  type,
  subject,
  domain,
  object,
  action,
  effect = 'allow',
  description,
  metadata,
  createdById,
}) =>
  prisma.authPolicy.create({
    data: {
      type,
      subject,
      domain,
      object,
      action,
      effect,
      description,
      metadata,
      createdById,
    },
  });

const updatePolicy = async (id, data = {}) =>
  prisma.authPolicy.update({
    where: { id },
    data,
  });

const deletePolicy = async (id, { soft = true } = {}) => {
  if (!soft) {
    return prisma.authPolicy.delete({
      where: { id },
    });
  }

  return prisma.authPolicy.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

const listPolicyRevisions = async ({ policyId, limit = 20 } = {}) =>
  prisma.authPolicyRevision.findMany({
    where: policyId ? { policyId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

const createPolicyRevision = async ({
  policyId,
  changeType,
  justification,
  summary,
  payload,
  createdById,
}) =>
  prisma.authPolicyRevision.create({
    data: {
      policyId,
      changeType,
      justification,
      summary,
      payload,
      createdById,
    },
  });

module.exports = {
  listPolicies,
  findPolicyById,
  createPolicy,
  updatePolicy,
  deletePolicy,
  listPolicyRevisions,
  createPolicyRevision,
};
