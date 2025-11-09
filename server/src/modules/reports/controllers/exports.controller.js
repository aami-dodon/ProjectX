const {
  createExportJob,
  getExportJob,
  retryExportJob,
} = require('../services/exports.service');

const createExportHandler = async (req, res, next) => {
  try {
    const data = await createExportJob({
      exportType: req.body?.exportType,
      format: req.body?.format ?? 'JSON',
      filters: req.body?.filters ?? {},
      schedule: req.body?.schedule ?? null,
      actorId: req.user?.id ?? null,
    });
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
};

const getExportHandler = async (req, res, next) => {
  try {
    const data = await getExportJob(req.params.exportId);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const retryExportHandler = async (req, res, next) => {
  try {
    const data = await retryExportJob({
      exportId: req.params.exportId,
      actorId: req.user?.id ?? null,
    });
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createExportHandler,
  getExportHandler,
  retryExportHandler,
};
