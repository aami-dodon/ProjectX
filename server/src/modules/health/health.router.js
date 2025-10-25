const express = require('express');
const { buildHealthResponse } = require('./health.service');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Operational health monitoring endpoints.
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Retrieve health diagnostics for core dependencies.
 *     description: >-
 *       Runs connectivity checks against the database, MinIO, SMTP, DNS, and system metrics to
 *       report the current platform health state.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Aggregated health information for the service and integrations.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         description: Unexpected error while assembling the health payload.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req, res, next) => {
  try {
    const payload = await buildHealthResponse(req.app);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
