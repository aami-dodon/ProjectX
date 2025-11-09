const {
  createFrameworkVersion,
  listVersionsForFramework,
} = require('../services/versions.service');

const listFrameworkVersionsHandler = async (req, res, next) => {
  try {
    const versions = await listVersionsForFramework(req.params?.frameworkId);
    return res.json({ data: versions });
  } catch (error) {
    return next(error);
  }
};

const createFrameworkVersionHandler = async (req, res, next) => {
  try {
    const record = await createFrameworkVersion({
      frameworkId: req.params?.frameworkId,
      payload: req.body ?? {},
    });
    return res.status(201).json({ data: record });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFrameworkVersionHandler,
  listFrameworkVersionsHandler,
};
