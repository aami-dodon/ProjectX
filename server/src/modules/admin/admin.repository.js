const { prisma } = require('@/integrations/prisma');

const USER_INCLUDE = {
  roleAssignments: {
    include: {
      role: true,
    },
  },
};

const listUsers = async ({ where = {}, limit, offset, orderBy } = {}) =>
  prisma.authUser.findMany({
    where,
    include: USER_INCLUDE,
    orderBy: Array.isArray(orderBy) && orderBy.length > 0 ? orderBy : { createdAt: 'desc' },
    ...(typeof limit === 'number' ? { take: limit } : {}),
    ...(typeof offset === 'number' ? { skip: offset } : {}),
  });

const countUsers = ({ where = {} } = {}) => prisma.authUser.count({ where });

const countUsersByStatus = async ({ where = {} } = {}) => {
  const results = await prisma.authUser.groupBy({
    by: ['status'],
    where,
    _count: { _all: true },
  });

  return results.reduce(
    (acc, entry) => ({
      ...acc,
      [entry.status]: entry._count?._all ?? 0,
    }),
    {}
  );
};

const listUserRegistrationsSince = async ({ since }) =>
  prisma.authUser.findMany({
    where: since
      ? {
          createdAt: {
            gte: since,
          },
        }
      : undefined,
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

const findUserById = (id) =>
  prisma.authUser.findUnique({
    where: { id },
    include: USER_INCLUDE,
  });

const updateUserById = (id, data) =>
  prisma.authUser.update({
    where: { id },
    data,
    include: USER_INCLUDE,
  });

const listRoles = () =>
  prisma.authRole.findMany({
    orderBy: { name: 'asc' },
  });

const findRolesByIds = (ids = []) =>
  prisma.authRole.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

module.exports = {
  listUsers,
  countUsers,
  countUsersByStatus,
  findUserById,
  updateUserById,
  listRoles,
  findRolesByIds,
  listUserRegistrationsSince,
};
