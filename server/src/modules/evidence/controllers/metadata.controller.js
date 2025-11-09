const {
  attachEvidenceLinks,
  detachEvidenceLink,
  getEvidenceDetail,
  getRetentionSummary,
  listEvidenceLibrary,
  updateEvidenceMetadata,
} = require('../services/metadata.service');

const listEvidence = async (req, res, next) => {
  try {
    const response = await listEvidenceLibrary({ query: req.query });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

const getEvidence = async (req, res, next) => {
  try {
    const record = await getEvidenceDetail(req.params?.evidenceId);
    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const updateMetadata = async (req, res, next) => {
  try {
    const record = await updateEvidenceMetadata({
      evidenceId: req.params?.evidenceId,
      payload: req.body,
      actorId: req.user?.id ?? null,
    });

    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const addLinks = async (req, res, next) => {
  try {
    const record = await attachEvidenceLinks({
      evidenceId: req.params?.evidenceId,
      payload: req.body,
      actorId: req.user?.id ?? null,
    });

    return res.status(201).json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const removeLink = async (req, res, next) => {
  try {
    const record = await detachEvidenceLink({
      evidenceId: req.params?.evidenceId,
      linkId: req.params?.linkId,
      actorId: req.user?.id ?? null,
    });

    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const retentionSummary = async (_req, res, next) => {
  try {
    const summary = await getRetentionSummary();
    return res.json({ data: summary });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addLinks,
  getEvidence,
  listEvidence,
  removeLink,
  retentionSummary,
  updateMetadata,
};
