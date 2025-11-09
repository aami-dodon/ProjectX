const {
  listCheckDefinitions,
  createCheckDefinition,
  updateCheckDefinition,
} = require('../checks/checks.service');
const { activateCheckDefinition } = require('../checks/lifecycle.service');

const listChecks = async (req, res, next) => {
  try {
    const data = await listCheckDefinitions(req.query ?? {});
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const createCheck = async (req, res, next) => {
  try {
    const record = await createCheckDefinition({
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.status(201).json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const updateCheck = async (req, res, next) => {
  try {
    const record = await updateCheckDefinition({
      checkId: req.params?.checkId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const activateCheck = async (req, res, next) => {
  try {
    const record = await activateCheckDefinition({
      checkId: req.params?.checkId,
      actorId: req.user?.id ?? null,
    });
    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  activateCheck,
  createCheck,
  listChecks,
  updateCheck,
};
