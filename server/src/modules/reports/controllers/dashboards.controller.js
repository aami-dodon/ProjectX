const {
  getFrameworkScoresDashboard,
  getControlHealthDashboard,
  getRemediationDashboard,
  getEvidenceDashboard,
} = require('../services/dashboard.service');

const getFrameworkScoresHandler = async (req, res, next) => {
  try {
    const data = await getFrameworkScoresDashboard(req.query ?? {});
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getControlHealthHandler = async (req, res, next) => {
  try {
    const data = await getControlHealthDashboard(req.query ?? {});
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getRemediationDashboardHandler = async (req, res, next) => {
  try {
    const data = await getRemediationDashboard(req.query ?? {});
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const getEvidenceDashboardHandler = async (_req, res, next) => {
  try {
    const data = await getEvidenceDashboard();
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getControlHealthHandler,
  getEvidenceDashboardHandler,
  getFrameworkScoresHandler,
  getRemediationDashboardHandler,
};
