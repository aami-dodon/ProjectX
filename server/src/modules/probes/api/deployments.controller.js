const {
  launchDeployment,
  listProbeDeployments,
} = require('@/modules/probes/services/deployment.service');

const listDeploymentsHandler = async (req, res, next) => {
  try {
    const deployments = await listProbeDeployments(req.params.probeId);
    return res.json({ data: deployments });
  } catch (error) {
    return next(error);
  }
};

const createDeploymentHandler = async (req, res, next) => {
  try {
    const deployment = await launchDeployment({
      probeId: req.params.probeId,
      payload: req.body,
      actor: req.user,
    });

    return res.status(201).json({ data: deployment });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createDeploymentHandler,
  listDeploymentsHandler,
};
