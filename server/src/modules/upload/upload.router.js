const express = require('express');

const { requestPresignedUpload } = require('@/modules/upload/controllers/upload.controller');

const router = express.Router();

/**
 * @openapi
 * /api/upload/presign:
 *   post:
 *     tags:
 *       - Uploads
 *     summary: Create a presigned MinIO URL for client uploads.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *             properties:
 *               contentType:
 *                 type: string
 *                 description: MIME type of the file that will be uploaded.
 *               prefix:
 *                 type: string
 *                 description: Directory prefix to scope the object key.
 *               allowAnyType:
 *                 type: boolean
 *                 description: Allow arbitrary MIME types by deriving the extension from the subtype.
 *     responses:
 *       '200':
 *         description: Presigned URLs for upload and download actions.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bucket:
 *                   type: string
 *                 objectName:
 *                   type: string
 *                 uploadUrl:
 *                   type: string
 *                 downloadUrl:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *                 headers:
 *                   type: object
 *       '400':
 *         description: The content type is missing or invalid.
 *       '500':
 *         description: Failed to create the presigned URL.
 */
router.post('/presign', requestPresignedUpload);

module.exports = router;
