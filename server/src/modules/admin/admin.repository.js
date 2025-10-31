const { prisma } = require('@/integrations/prisma');

const USER_INCLUDE = {
  roleAssignments: {
    include: {
      role: true,
    },
  },
};

const listUsers = async ({ where = {}, limit, offset } = {}) =>
  prisma.authUser.findMany({
    where,
    include: USER_INCLUDE,
    orderBy: { createdAt: 'desc' },
    ...(typeof limit === 'number' ? { take: limit } : {}),
    ...(typeof offset === 'number' ? { skip: offset } : {}),
  });

const countUsers = ({ where = {} } = {}) => prisma.authUser.count({ where });

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
  findUserById,
  updateUserById,
  listRoles,
  findRolesByIds,
};
