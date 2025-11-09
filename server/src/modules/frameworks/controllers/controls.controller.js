const {
  createFrameworkControl,
  listControlsForFramework,
} = require('../services/controls.service');

const listFrameworkControlsHandler = async (req, res, next) => {
  try {
    const controls = await listControlsForFramework({
      frameworkId: req.params?.frameworkId,
      filters: req.query ?? {},
    });
    return res.json({ data: controls });
  } catch (error) {
    return next(error);
  }
};

const createFrameworkControlHandler = async (req, res, next) => {
  try {
    const control = await createFrameworkControl({
      frameworkId: req.params?.frameworkId,
      payload: req.body ?? {},
    });
    return res.status(201).json({ data: control });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFrameworkControlHandler,
  listFrameworkControlsHandler,
};
