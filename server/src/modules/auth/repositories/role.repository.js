const { prisma } = require('@/integrations/prisma');

const ROLE_INCLUDE = {
  inheritsRole: {
    select: {
      id: true,
      name: true,
      domain: true,
    },
  },
  childRoles: {
    select: {
      id: true,
      name: true,
      domain: true,
    },
  },
};

const ASSIGNMENT_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
  role: {
    select: {
      id: true,
      name: true,
      domain: true,
    },
  },
};

const buildDomainFilter = (domain) => {
  if (!domain) {
    return undefined;
  }

  return {
    OR: [{ domain }, { domain: null }],
  };
};

const listRoles = async ({ domain, includeArchived = false } = {}) =>
  prisma.authRole.findMany({
    where: {
      ...buildDomainFilter(domain),
      ...(includeArchived ? {} : { archivedAt: null }),
    },
    include: {
      ...ROLE_INCLUDE,
      _count: {
        select: {
          assignments: true,
        },
      },
    },
    orderBy: [{ domain: 'asc' }, { name: 'asc' }],
  });

const findRoleById = async (id) =>
  prisma.authRole.findUnique({
    where: { id },
    include: {
      ...ROLE_INCLUDE,
      assignments: {
        include: ASSIGNMENT_INCLUDE,
        where: {
          revokedAt: null,
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

const createRole = async ({
  name,
  description,
  tenantId = null,
  domain = 'global',
  inheritsRoleId = null,
  reviewCadenceDays = null,
  metadata = null,
  isSystemDefault = false,
}) =>
  prisma.authRole.create({
    data: {
      name,
      description,
      tenantId,
      domain,
      inheritsRoleId,
      reviewCadenceDays,
      metadata,
      isSystemDefault,
    },
    include: {
      ...ROLE_INCLUDE,
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

const updateRole = async (id, data) =>
  prisma.authRole.update({
    where: { id },
    data,
    include: {
      ...ROLE_INCLUDE,
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

const archiveRole = async (id) =>
  prisma.authRole.update({
    where: { id },
    data: { archivedAt: new Date() },
    include: {
      ...ROLE_INCLUDE,
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

const listRoleAssignments = async (roleId) =>
  prisma.authRoleAssignment.findMany({
    where: {
      roleId,
      revokedAt: null,
    },
    include: ASSIGNMENT_INCLUDE,
    orderBy: { assignedAt: 'desc' },
  });

module.exports = {
  listRoles,
  findRoleById,
  createRole,
  updateRole,
  archiveRole,
  listRoleAssignments,
};
