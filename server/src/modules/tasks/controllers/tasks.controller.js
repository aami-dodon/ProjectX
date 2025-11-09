const {
  listTaskRecords,
  createTask,
  updateTask,
  getTaskDetail,
  getTaskTimeline,
  attachEvidence,
  getTaskSlaSummary,
} = require('../services/task.service');

const listTasksHandler = async (req, res, next) => {
  try {
    const result = await listTaskRecords(req.query ?? {});
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const createTaskHandler = async (req, res, next) => {
  try {
    const data = await createTask({
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });

    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

const getTaskHandler = async (req, res, next) => {
  try {
    const data = await getTaskDetail(req.params.taskId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const updateTaskHandler = async (req, res, next) => {
  try {
    const data = await updateTask({
      taskId: req.params.taskId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getTaskTimelineHandler = async (req, res, next) => {
  try {
    const data = await getTaskTimeline({
      taskId: req.params.taskId,
      limit: Number(req.query.limit) || 100,
    });

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const attachTaskEvidenceHandler = async (req, res, next) => {
  try {
    const data = await attachEvidence({
      taskId: req.params.taskId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });

    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

const getTaskSlaSummaryHandler = async (_req, res, next) => {
  try {
    const data = await getTaskSlaSummary();
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  attachTaskEvidenceHandler,
  createTaskHandler,
  getTaskHandler,
  getTaskTimelineHandler,
  getTaskSlaSummaryHandler,
  listTasksHandler,
  updateTaskHandler,
};
