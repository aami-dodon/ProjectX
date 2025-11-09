const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('reports-exports-repository');

const createExportRecord = async ({ exportType, format, filters, schedule, status = 'PENDING', requestedById }) =>
  prisma.reportExport.create({
    data: {
      exportType,
      format,
      filters,
      schedule,
      status,
      requestedById,
    },
  });

const updateExportRecord = async (exportId, data) =>
  prisma.reportExport.update({
    where: { id: exportId },
    data,
  });

const findExportById = async (exportId) =>
  prisma.reportExport.findUnique({
    where: { id: exportId },
    include: {
      requestedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

const logExportEvent = async ({ exportId, actorId, eventType, payload }) => {
  try {
    return await prisma.reportAuditLog.create({
      data: {
        exportId,
        actorId,
        eventType,
        payload,
      },
    });
  } catch (error) {
    logger.warn('Failed to persist export audit log', {
      exportId,
      eventType,
      error: error.message,
    });
    return null;
  }
};

module.exports = {
  createExportRecord,
  findExportById,
  logExportEvent,
  updateExportRecord,
};
