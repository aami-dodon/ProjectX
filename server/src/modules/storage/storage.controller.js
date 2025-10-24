const logger = require('../../utils/logger');
const { uploadImage } = require('./storage.service');

const uploadImageHandler = async (req, res, next) => {
  try {
    const result = await uploadImage(req.file);

    logger.info('Image uploaded to MinIO', {
      requestId: req.context?.requestId,
      traceId: req.context?.traceId,
      details: result,
    });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImageHandler,
};
