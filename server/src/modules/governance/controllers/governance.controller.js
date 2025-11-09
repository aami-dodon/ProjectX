const { getGovernanceOverview } = require('../overview/overview.service');
const { runBatchExecutions } = require('../checks/execution.service');

const getOverview = async (req, res, next) => {
  try {
    const overview = await getGovernanceOverview();
    return res.json({ data: overview });
  } catch (error) {
    return next(error);
  }
};

const triggerBatchRuns = async (req, res, next) => {
  try {
    const result = await runBatchExecutions({
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.status(202).json({ data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOverview,
  triggerBatchRuns,
};
