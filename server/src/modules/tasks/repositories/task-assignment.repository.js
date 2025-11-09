const { prisma } = require('@/integrations/prisma');

const ASSIGNMENT_INCLUDE = {
  assignee: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
  delegatedBy: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
};

const createAssignmentRecord = async ({
  taskId,
  assigneeId,
  teamId,
  delegatedById,
  delegationExpiresAt,
  justification,
}) =>
  prisma.taskAssignment.create({
    data: {
      taskId,
      assigneeId: assigneeId ?? null,
      teamId: teamId ?? null,
      delegatedById: delegatedById ?? null,
      delegationExpiresAt: delegationExpiresAt ?? null,
      justification: justification ?? null,
    },
    include: ASSIGNMENT_INCLUDE,
  });

const revokeAssignmentRecord = async (assignmentId, { revokedAt = new Date() } = {}) =>
  prisma.taskAssignment.update({
    where: { id: assignmentId },
    data: {
      revokedAt,
    },
    include: ASSIGNMENT_INCLUDE,
  });

const listAssignmentsForTask = async (taskId, { limit = 20 } = {}) =>
  prisma.taskAssignment.findMany({
    where: { taskId },
    include: ASSIGNMENT_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

const findAssignmentById = async (assignmentId) =>
  prisma.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: ASSIGNMENT_INCLUDE,
  });

const revokeAssignmentsForTask = async (taskId, { revokedAt = new Date() } = {}) =>
  prisma.taskAssignment.updateMany({
    where: {
      taskId,
      revokedAt: null,
    },
    data: {
      revokedAt,
    },
  });

module.exports = {
  createAssignmentRecord,
  findAssignmentById,
  listAssignmentsForTask,
  revokeAssignmentRecord,
  revokeAssignmentsForTask,
};
