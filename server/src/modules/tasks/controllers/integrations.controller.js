const { syncTaskWithProvider } = require('../services/task.service');

const syncTaskIntegrationHandler = async (req, res, next) => {
  try {
    const data = await syncTaskWithProvider({
      taskId: req.params.taskId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  syncTaskIntegrationHandler,
};
