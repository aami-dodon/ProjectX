const {
  listFrameworks,
  createFrameworkDefinition,
  getFrameworkDetail,
  updateFrameworkDefinition,
} = require('../services/frameworks.service');

const listFrameworkCatalog = async (req, res, next) => {
  try {
    const response = await listFrameworks(req.query ?? {});
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

const createFramework = async (req, res, next) => {
  try {
    const record = await createFrameworkDefinition({
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.status(201).json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const getFramework = async (req, res, next) => {
  try {
    const result = await getFrameworkDetail({
      frameworkId: req.params?.frameworkId,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const updateFramework = async (req, res, next) => {
  try {
    const record = await updateFrameworkDefinition({
      frameworkId: req.params?.frameworkId,
      payload: req.body ?? {},
    });
    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFramework,
  getFramework,
  listFrameworkCatalog,
  updateFramework,
};
