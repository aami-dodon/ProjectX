const fileService = require('./file.service');
const { createValidationError } = require('@/utils/errors');

const requestUploadUrl = async (req, res, next) => {
  try {
    const { filename, mimeType } = req.query ?? {};

    if (!filename || typeof filename !== 'string') {
      throw createValidationError('filename query parameter is required');
    }

    if (!mimeType || typeof mimeType !== 'string') {
      throw createValidationError('mimeType query parameter is required');
    }

    const result = await fileService.createUploadSlot(req.user.id, filename, mimeType);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const requestDownloadUrl = async (req, res, next) => {
  try {
    const { objectName } = req.query ?? {};

    if (!objectName || typeof objectName !== 'string') {
      throw createValidationError('objectName query parameter is required');
    }

    const result = await fileService.getFileAccessLink(objectName, req.user.id);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requestUploadUrl,
  requestDownloadUrl,
};
