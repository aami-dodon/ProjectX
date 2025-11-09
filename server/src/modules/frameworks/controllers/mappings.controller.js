const {
  createFrameworkMapping,
  listMappingsForFramework,
} = require('../services/mappings.service');

const listFrameworkMappingsHandler = async (req, res, next) => {
  try {
    const response = await listMappingsForFramework({
      frameworkId: req.params?.frameworkId,
      params: req.query ?? {},
    });
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

const createFrameworkMappingHandler = async (req, res, next) => {
  try {
    const record = await createFrameworkMapping({
      frameworkId: req.params?.frameworkId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.status(201).json({ data: record });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFrameworkMappingHandler,
  listFrameworkMappingsHandler,
};
