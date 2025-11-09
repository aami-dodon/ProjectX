const { prisma } = require('@/integrations/prisma');
const { findEvidenceById } = require('./evidence.repository');

const addEvidenceLinks = async (evidenceId, links) => {
  if (!Array.isArray(links) || links.length === 0) {
    return findEvidenceById(evidenceId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.evidenceLink.createMany({
      data: links.map((link) => ({
        ...link,
        evidenceId,
      })),
      skipDuplicates: true,
    });
  });

  return findEvidenceById(evidenceId);
};

const removeEvidenceLinkById = async (evidenceId, linkId) => {
  const removed = await prisma.$transaction(async (tx) => {
    const link = await tx.evidenceLink.findUnique({ where: { id: linkId } });
    if (!link || link.evidenceId !== evidenceId) {
      return null;
    }

    await tx.evidenceLink.delete({ where: { id: linkId } });
    return link;
  });

  if (!removed) {
    return null;
  }

  return findEvidenceById(evidenceId);
};

module.exports = {
  addEvidenceLinks,
  removeEvidenceLinkById,
};
