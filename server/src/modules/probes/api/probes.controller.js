const { createProbe, getProbe, listRegistryProbes } = require('@/modules/probes/services/registry.service');
const { getProbeMetricsSummary } = require('@/modules/probes/services/health.service');
const { triggerProbeRun } = require('@/modules/probes/services/scheduler.service');

const listProbesHandler = async (req, res, next) => {
  try {
    const result = await listRegistryProbes(req.query ?? {});
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const createProbeHandler = async (req, res, next) => {
  try {
    const record = await createProbe(req.body, req.user);
    return res.status(201).json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const getProbeHandler = async (req, res, next) => {
  try {
    const record = await getProbe(req.params.probeId);
    return res.json({ data: record });
  } catch (error) {
    return next(error);
  }
};

const getProbeMetricsHandler = async (req, res, next) => {
  try {
    const metrics = await getProbeMetricsSummary(req.params.probeId);
    return res.json({ data: metrics });
  } catch (error) {
    return next(error);
  }
};

const runProbeHandler = async (req, res, next) => {
  try {
    const response = await triggerProbeRun({
      probeId: req.params.probeId,
      payload: req.body,
      actor: req.user,
    });

    return res.status(202).json(response);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProbeHandler,
  getProbeHandler,
  getProbeMetricsHandler,
  listProbesHandler,
  runProbeHandler,
};
