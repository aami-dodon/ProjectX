const express = require('express');

const { authenticateRequest } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { requestDownloadUrl, requestUploadUrl } = require('./file.controller');

const router = express.Router();

/**
 * @openapi
 * /api/files/upload-url:
 *   get:
 *     summary: Generate a presigned URL for uploading a file to object storage.
 *     description: |-
 *       Returns a short-lived presigned URL that allows the authenticated user to upload a
 *       file directly to the configured MinIO bucket. The resulting object key is scoped to the
 *       caller's user segment and must be supplied when later requesting a download link.
 *     tags:
 *       - Files
 *     parameters:
 *       - in: query
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Original filename including extension. Used to derive the stored object name.
 *       - in: query
 *         name: mimeType
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - image/jpeg
 *             - image/png
 *             - image/webp
 *             - application/pdf
 *         description: MIME type of the file being uploaded. Only supported values are accepted.
 *     responses:
 *       '200':
 *         description: Presigned upload URL and associated metadata for the new object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - uploadUrl
 *                 - fileUrl
 *                 - category
 *                 - objectName
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                   format: uri
 *                   description: Signed URL that accepts the PUT upload request.
 *                 fileUrl:
 *                   type: string
 *                   description: Relative object path that uniquely identifies the stored file.
 *                 category:
 *                   type: string
 *                   description: Classification bucket inferred from the MIME type.
 *                   enum:
 *                     - images
 *                     - documents
 *                 objectName:
 *                   type: string
 *                   description: Fully qualified object key to reuse when requesting download access.
 */
router.get('/upload-url', authenticateRequest, attachAuditContext, requestUploadUrl);

/**
 * @openapi
 * /api/files/download-url:
 *   get:
 *     summary: Retrieve a presigned download URL for a previously uploaded file.
 *     description: |-
 *       Validates the requested object is owned by the authenticated user before issuing a
 *       short-lived presigned GET URL. The returned link can be used by browsers or background
 *       jobs to stream the file contents directly from MinIO without proxying through the API.
 *     tags:
 *       - Files
 *     parameters:
 *       - in: query
 *         name: objectName
 *         required: true
 *         schema:
 *           type: string
 *         description: Object key originally returned from the upload URL request.
 *     responses:
 *       '200':
 *         description: Presigned URL that permits temporary read access to the object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - url
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Signed URL that can be used to download the file contents.
 */
router.get('/download-url', authenticateRequest, attachAuditContext, requestDownloadUrl);

module.exports = router;
