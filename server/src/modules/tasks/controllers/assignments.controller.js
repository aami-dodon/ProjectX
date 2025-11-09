const { assignTask, revokeAssignment } = require('../services/task.service');

const assignTaskHandler = async (req, res, next) => {
  try {
    const data = await assignTask({
      taskId: req.params.taskId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });

    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

const revokeAssignmentHandler = async (req, res, next) => {
  try {
    const data = await revokeAssignment({
      assignmentId: req.params.assignmentId,
      actorId: req.user?.id ?? null,
    });

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  assignTaskHandler,
  revokeAssignmentHandler,
};
