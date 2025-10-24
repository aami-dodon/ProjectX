const express = require('express');
const multer = require('multer');
const { minioClient } = require('../../integrations/minio');
const { env } = require('../../config/env');
const { createValidationError, createIntegrationError } = require('../../../../shared/error-handling');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();

router.post('/upload', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return next(createValidationError('Image file is required'));
  }

  if (!req.file.mimetype.startsWith('image/')) {
    return next(createValidationError('Only image uploads are supported'));
  }

  const objectName = `health/${Date.now()}-${req.file.originalname}`;

  try {
    await minioClient.putObject(env.MINIO_BUCKET, objectName, req.file.buffer, req.file.size, {
      'Content-Type': req.file.mimetype,
    });

    const presignedUrl = await minioClient.presignedGetObject(
      env.MINIO_BUCKET,
      objectName,
      env.MINIO_PRESIGNED_URL_EXPIRY_SECONDS,
    );

    return res.json({
      bucket: env.MINIO_BUCKET,
      objectName,
      presignedUrl,
    });
  } catch (error) {
    return next(createIntegrationError('Failed to upload image to MinIO', { cause: error.message }));
  }
});

module.exports = router;
