const {
  getCheckResults,
  runCheckExecution,
} = require('../checks/execution.service');
const { publishResult } = require('../checks/lifecycle.service');

const listResults = async (req, res, next) => {
  try {
    const payload = await getCheckResults(req.params?.checkId, req.query ?? {});
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

const runCheck = async (req, res, next) => {
  try {
    const data = await runCheckExecution({
      checkId: req.params?.checkId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.status(202).json(data);
  } catch (error) {
    return next(error);
  }
};

const publishResultHandler = async (req, res, next) => {
  try {
    const result = await publishResult({
      resultId: req.params?.resultId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.json({ data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listResults,
  publishResultHandler,
  runCheck,
};
