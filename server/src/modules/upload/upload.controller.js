const { createPresignedUpload, IMAGE_EXTENSION_BY_MIME } = require('@/modules/upload/upload.service');
const { createLogger } = require('@/utils/logger');
const { createValidationError, createIntegrationError } = require('@/utils/errors');

const logger = createLogger('upload-controller');

const requestPresignedUpload = async (req, res, next) => {
  const { contentType, prefix = 'uploads', allowAnyType = false } = req.body ?? {};

  if (!contentType || typeof contentType !== 'string') {
    return next(createValidationError('Content type is required'));
  }

  try {
    const payload = await createPresignedUpload({
      contentType,
      prefix,
      extensionMap: allowAnyType ? {} : IMAGE_EXTENSION_BY_MIME,
    });

    return res.json(payload);
  } catch (error) {
    logger.error('Failed to create presigned upload URL', { error: error.message });
    return next(createIntegrationError('Failed to create presigned upload URL', { cause: error.message }));
  }
};

module.exports = {
  requestPresignedUpload,
};
