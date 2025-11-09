const {
  createSchedule,
  listProbeSchedules,
} = require('@/modules/probes/services/scheduler.service');

const listSchedulesHandler = async (req, res, next) => {
  try {
    const schedules = await listProbeSchedules(req.params.probeId);
    return res.json({ data: schedules });
  } catch (error) {
    return next(error);
  }
};

const createScheduleHandler = async (req, res, next) => {
  try {
    const schedule = await createSchedule({
      probeId: req.params.probeId,
      payload: req.body,
      actor: req.user,
    });

    return res.status(201).json({ data: schedule });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createScheduleHandler,
  listSchedulesHandler,
};
