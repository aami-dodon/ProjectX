const express = require('express');

const {
  getHealth,
  requestStoragePresign,
  sendTestEmailFromHealth,
} = require('@/modules/health/controllers/health.controller');

const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Retrieve aggregated service and infrastructure diagnostics.
 *     description: >-
 *       Returns the overall health classification alongside runtime metrics for the
 *       API host, active integrations, and configured CORS policy. No authentication
 *       is required so monitoring tools can call this endpoint directly.
 *     tags:
 *       - Health
 *     security: []
 *     responses:
 *       '200':
 *         description: Aggregated health snapshot for the Project X platform.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *                 - timestamp
 *                 - data
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Overall availability classification derived from all checks.
 *                   enum:
 *                     - operational
 *                     - degraded
 *                     - outage
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: ISO-8601 timestamp describing when the response was generated.
 *                 requestId:
 *                   type: string
 *                   nullable: true
 *                   description: Request correlation identifier (always null until request tracing is enabled).
 *                 traceId:
 *                   type: string
 *                   nullable: true
 *                   description: Distributed trace identifier (always null until tracing is enabled).
 *                 data:
 *                   type: object
 *                   required:
 *                     - system
 *                     - api
 *                     - cors
 *                   properties:
 *                     system:
 *                       type: object
 *                       description: Host and process metrics collected from the Node.js runtime.
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum:
 *                             - operational
 *                             - degraded
 *                             - outage
 *                         uptimeSeconds:
 *                           type: integer
 *                           nullable: true
 *                         startedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         nodeVersion:
 *                           type: string
 *                         environment:
 *                           type: string
 *                         cpu:
 *                           type: object
 *                           description: Snapshot of CPU utilisation and load averages.
 *                           properties:
 *                             cores:
 *                               type: integer
 *                               nullable: true
 *                             utilizationPercent:
 *                               type: number
 *                               nullable: true
 *                             loadAverages:
 *                               type: object
 *                               properties:
 *                                 oneMinute:
 *                                   type: number
 *                                   nullable: true
 *                                 fiveMinute:
 *                                   type: number
 *                                   nullable: true
 *                                 fifteenMinute:
 *                                   type: number
 *                                   nullable: true
 *                         memory:
 *                           type: object
 *                           description: Memory utilisation metrics in bytes.
 *                           properties:
 *                             totalBytes:
 *                               type: integer
 *                               nullable: true
 *                             freeBytes:
 *                               type: integer
 *                               nullable: true
 *                             usedBytes:
 *                               type: integer
 *                               nullable: true
 *                             utilizationPercent:
 *                               type: number
 *                               nullable: true
 *                         disk:
 *                           type: object
 *                           description: Root filesystem usage metrics in bytes.
 *                           properties:
 *                             totalBytes:
 *                               type: integer
 *                               nullable: true
 *                             freeBytes:
 *                               type: integer
 *                               nullable: true
 *                             usedBytes:
 *                               type: integer
 *                               nullable: true
 *                             utilizationPercent:
 *                               type: number
 *                               nullable: true
 *                         process:
 *                           type: object
 *                           description: Node.js process CPU and memory statistics.
 *                           properties:
 *                             pid:
 *                               type: integer
 *                             cpu:
 *                               type: object
 *                               properties:
 *                                 averageUtilizationPercent:
 *                                   type: number
 *                                   nullable: true
 *                                 totalCpuSeconds:
 *                                   type: number
 *                                   nullable: true
 *                                 userMicros:
 *                                   type: integer
 *                                   nullable: true
 *                                 systemMicros:
 *                                   type: integer
 *                                   nullable: true
 *                             memory:
 *                               type: object
 *                               properties:
 *                                 rssBytes:
 *                                   type: integer
 *                                   nullable: true
 *                                 heapTotalBytes:
 *                                   type: integer
 *                                   nullable: true
 *                                 heapUsedBytes:
 *                                   type: integer
 *                                   nullable: true
 *                                 externalBytes:
 *                                   type: integer
 *                                   nullable: true
 *                                 arrayBuffersBytes:
 *                                   type: integer
 *                                   nullable: true
 *                         metrics:
 *                           type: object
 *                           description: Redundant structure used by the health dashboard to present backend metrics.
 *                           additionalProperties: true
 *                     api:
 *                       type: object
 *                       description: Status of downstream API dependencies.
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum:
 *                             - operational
 *                             - degraded
 *                             - outage
 *                         checkedAt:
 *                           type: string
 *                           format: date-time
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum:
 *                                 - operational
 *                                 - degraded
 *                                 - outage
 *                             latencyMs:
 *                               type: number
 *                               nullable: true
 *                             error:
 *                               type: string
 *                               nullable: true
 *                             provider:
 *                               type: string
 *                     cors:
 *                       type: object
 *                       description: Evaluation of the configured CORS policy.
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum:
 *                             - operational
 *                             - degraded
 *                             - outage
 *                         allowedOrigins:
 *                           type: array
 *                           items:
 *                             type: string
 *                         allowsCredentials:
 *                           type: boolean
 *                         allowedHeaders:
 *                           type: array
 *                           items:
 *                             type: string
 *                         issues:
 *                           type: array
 *                           items:
 *                             type: string
 *       '500':
 *         description: The health service failed to collect telemetry from one or more sources.
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
router.get('/', getHealth);

/**
 * @openapi
 * /api/health/storage/presign:
 *   post:
 *     summary: Create a presigned upload URL for health checks.
 *     description: >-
 *       Generates both PUT and GET presigned URLs so the health dashboard can upload
 *       and verify assets against the configured MinIO bucket. The request must
 *       identify the MIME type of the image being uploaded. After receiving the
 *       response, issue an HTTP PUT to the returned `uploadUrl` with the raw image
 *       bytes as the request body and include every header from the `headers`
 *       object (for example, `Content-Type`).
 *     tags:
 *       - Health
 *     security: []
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
 *                 example: image/png
 *                 description: MIME type of the asset that will be uploaded to object storage.
 *           example:
 *             contentType: image/png
 *     responses:
 *       '200':
 *         description: Upload target and presigned URL details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - bucket
 *                 - objectName
 *                 - uploadUrl
 *                 - downloadUrl
 *                 - expiresIn
 *                 - headers
 *               properties:
 *                 bucket:
 *                   type: string
 *                   description: MinIO bucket that will store the uploaded asset.
 *                 objectName:
 *                   type: string
 *                   description: Object key generated for the asset, including any health namespace prefix.
 *                 uploadUrl:
 *                   type: string
 *                   format: uri
 *                   description: Presigned PUT URL that accepts the upload.
 *                 downloadUrl:
 *                   type: string
 *                   format: uri
 *                   description: Presigned GET URL that validates the upload succeeded.
 *                 expiresIn:
 *                   type: integer
 *                   description: Number of seconds before the presigned URLs expire.
 *                 headers:
 *                   type: object
 *                   description: Required headers to include with the PUT request when uploading the file.
 *                   additionalProperties:
 *                     type: string
 *               example:
 *                 bucket: project-x-health
 *                 objectName: health/1713865800123-a1b2c3d4.png
 *                 uploadUrl: https://minio.local/upload
 *                 downloadUrl: https://minio.local/download
 *                 expiresIn: 900
 *                 headers:
 *                   Content-Type: image/png
 *       '400':
 *         description: The supplied content type was missing or unsupported.
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
 *         description: MinIO rejected the operation or could not be reached.
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
 *     x-codeSamples:
 *       - lang: Shell
 *         label: Request presign and upload image
 *         source: >-
 *           curl --request POST "$API_URL/api/health/storage/presign" \
 *             --header 'Content-Type: application/json' \
 *             --data '{"contentType":"image/png"}' \
 *           | jq -r '. | "UPLOAD_URL=" + .uploadUrl + "\nHEADER=" + (.headers["Content-Type"])' \
 *           | while IFS== read -r key value; do export "$key=$value"; done;
 *           curl --request PUT "$UPLOAD_URL" \
 *             --header "Content-Type: $HEADER" \
 *             --data-binary '@image.png'
*/
router.post('/storage/presign', requestStoragePresign);

/**
 * @openapi
 * /api/health/email/test:
 *   post:
 *     summary: Send a test email via the health diagnostics workflow.
 *     description: >-
 *       Validates the SMTP configuration by attempting to send a transactional
 *       message to the provided inbox. The endpoint performs minimal validation on
 *       the recipient address and surfaces integration errors to the caller.
 *     tags:
 *       - Health
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address that should receive the test message.
 *     responses:
 *       '200':
 *         description: Confirmation that the test email was queued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - status
 *               properties:
 *                 status:
 *                   type: string
 *                   example: sent
 *                 messageId:
 *                   type: string
 *                   nullable: true
 *                   description: Message identifier returned by the SMTP transport.
 *       '400':
 *         description: The request body was missing the recipient email address.
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
 *         description: The SMTP transport rejected the message or was unreachable.
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
router.post('/email/test', sendTestEmailFromHealth);

module.exports = router;
