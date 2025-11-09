const {
  archiveControlDefinition,
  createControlDefinition,
  getControlDetail,
  listControlCatalog,
  serializeControl,
  updateControlDefinition,
} = require('../controls/control.service');
const { replaceControlMappings } = require('../controls/mapping.service');
const { getControlScoreHistory } = require('../controls/scoring.service');
const { triggerControlRemediation } = require('../controls/lifecycle.service');

const listControls = async (req, res, next) => {
  try {
    const response = await listControlCatalog(req.query ?? {});
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

const createControl = async (req, res, next) => {
  try {
    const record = await createControlDefinition({
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.status(201).json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const getControl = async (req, res, next) => {
  try {
    const record = await getControlDetail(req.params?.controlId);
    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const updateControl = async (req, res, next) => {
  try {
    const record = await updateControlDefinition({
      controlId: req.params?.controlId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const archiveControl = async (req, res, next) => {
  try {
    const record = await archiveControlDefinition({
      controlId: req.params?.controlId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const updateControlMappings = async (req, res, next) => {
  try {
    const record = await replaceControlMappings({
      controlId: req.params?.controlId,
      mappings: req.body?.frameworkMappings ?? [],
      actorId: req.user?.id ?? null,
    });
    return res.json({ data: serializeControl(record, { detail: true }) });
  } catch (error) {
    return next(error);
  }
};

const getControlScores = async (req, res, next) => {
  try {
    const scores = await getControlScoreHistory({
      controlId: req.params?.controlId,
      query: req.query ?? {},
    });
    return res.json({ data: scores });
  } catch (error) {
    return next(error);
  }
};

const triggerControlRemediationHandler = async (req, res, next) => {
  try {
    const result = await triggerControlRemediation({
      controlId: req.params?.controlId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.status(202).json({ data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  archiveControl,
  createControl,
  getControl,
  getControlScores,
  listControls,
  triggerControlRemediationHandler,
  updateControl,
  updateControlMappings,
};
