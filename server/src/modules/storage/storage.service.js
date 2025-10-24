const path = require('path');
const crypto = require('crypto');
const { uploadObject, createPresignedGetUrl } = require('../../integrations/minioClient');
const { requireShared } = require('../../utils/sharedModule');

const { createValidationError } = requireShared('error-handling');

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const uploadImage = async (file) => {
  if (!file) {
    throw createValidationError('A file is required for upload', { field: 'file' });
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw createValidationError('Only image uploads are supported', {
      field: 'file',
      mimeType: file.mimetype,
    });
  }

  const extension = path.extname(file.originalname) || '.png';
  const objectKey = `health-check/${crypto.randomUUID()}${extension}`;

  await uploadObject({
    key: objectKey,
    body: file.buffer,
    contentType: file.mimetype,
  });

  const url = await createPresignedGetUrl(objectKey);

  return {
    key: objectKey,
    url,
    size: file.size,
    mimeType: file.mimetype,
  };
};

module.exports = {
  uploadImage,
};
