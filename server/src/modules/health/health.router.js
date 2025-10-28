const express = require('express');

const { getHealth } = require('@/modules/health/health.controller');

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

module.exports = router;
