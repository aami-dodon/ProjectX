const express = require('express');
const multer = require('multer');
const { minioClient } = require('@/integrations/minio');
const { env } = require('@/config/env');
const { createValidationError, createIntegrationError } = require('@/utils/error-handling');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = express.Router();

/**
 * @openapi
 * /api/storage/upload:
 *   post:
 *     summary: Upload an image to object storage and receive a presigned URL.
 *     description: Handles health dashboard uploads by streaming the provided image to MinIO and returning a GET URL for verification.
 *     tags:
 *       - Storage
 *     security: []
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
 *                 description: Image file to upload to MinIO.
 *     responses:
 *       '200':
 *         description: Upload result details including the presigned URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - bucket
 *                 - objectName
 *                 - presignedUrl
 *               properties:
 *                 bucket:
 *                   type: string
 *                   description: MinIO bucket that stores the uploaded image.
 *                 objectName:
 *                   type: string
 *                   description: Generated object key that includes a health namespace prefix.
 *                 presignedUrl:
 *                   type: string
 *                   format: uri
 *                   description: GET URL that can be used to read the uploaded asset until it expires.
 *       '400':
 *         description: The upload was missing or used an unsupported MIME type.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     code:
 *                       type: string
 *                     details:
 *                       nullable: true
 *                     requestId:
 *                       nullable: true
 *                     traceId:
 *                       nullable: true
 *       '502':
 *         description: MinIO rejected the upload or was unreachable.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     code:
 *                       type: string
 *                     details:
 *                       nullable: true
 *                     requestId:
 *                       nullable: true
 *                     traceId:
 *                       nullable: true
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
