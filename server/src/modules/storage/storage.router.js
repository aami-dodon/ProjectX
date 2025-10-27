const express = require('express');
const multer = require('multer');
const { minioClient } = require('../../integrations/minio');
const { env } = require('../../config/env');
const { createValidationError, createIntegrationError } = require('../../../../shared/error-handling');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Storage
 *     description: Utilities for validating connectivity with the MinIO object store.
 */

/**
 * @swagger
 * /api/v1/storage/upload:
 *   post:
 *     summary: Upload an image to MinIO and retrieve a presigned access URL.
 *     tags: [Storage]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (max 5 MiB) to upload to MinIO for validation.
 *     responses:
 *       200:
 *         description: File uploaded successfully and presigned URL generated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StorageUploadResponse'
 *       400:
 *         description: Validation failed for the uploaded file.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: MinIO integration error prevented the upload from completing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
      env.MINIO_PRESIGNED_URL_EXPIRATION_SECONDS,
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
