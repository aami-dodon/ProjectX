const { prisma } = require('@/integrations/prisma');

const USER_INCLUDE = {
  roleAssignments: {
    include: {
      role: true,
    },
  },
};

const listUsers = async ({ where = {} } = {}) =>
  prisma.authUser.findMany({
    where,
    include: USER_INCLUDE,
    orderBy: { createdAt: 'desc' },
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

module.exports = {
  listUsers,
  countUsers,
  findUserById,
  updateUserById,
};
