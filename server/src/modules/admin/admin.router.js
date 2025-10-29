const express = require('express');

const { authenticateRequest, requireRoles } = require('@/modules/auth/auth.middleware');
const { listUsers, updateUser } = require('./admin.controller');

const router = express.Router();

router.use(authenticateRequest);
router.use(requireRoles('admin'));

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: Retrieve platform users for administrative management.
 *     description: |-
 *       Lists users with their current status and role assignments. Requires the authenticated
 *       caller to hold the `admin` role.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Optional free text filter that matches against email, full name or tenant ID.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_VERIFICATION, ACTIVE, SUSPENDED, INVITED]
 *         description: Optional status filter that narrows the list to users with the provided state.
 *     responses:
 *       '200':
 *         description: Collection of users with dashboard metrics.
 */
router.get('/users', listUsers);

/**
 * @openapi
 * /api/admin/users/{userId}:
 *   patch:
 *     summary: Update a user's profile and administrative state.
 *     description: Applies profile or status changes to the requested account. Only the admin role
 *       is permitted to perform this action.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifier of the user to update.
 *     responses:
 *       '200':
 *         description: Updated user record.
 */
router.patch('/users/:userId', updateUser);

module.exports = router;
