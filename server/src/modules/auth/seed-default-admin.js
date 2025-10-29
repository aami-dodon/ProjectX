const bcrypt = require('bcryptjs');

const { env } = require('@/config/env');
const { createLogger } = require('@/utils/logger');
const {
  assignRoleToUser,
  createUser,
  findUserByEmail,
  updateUser,
  upsertRole,
} = require('./auth.repository');

const logger = createLogger('auth-seed');

const ADMIN_ROLE_NAME = 'admin';
const ADMIN_ROLE_DESCRIPTION = 'Platform administrator with full access to governance and operational tooling.';

const ensureDefaultAdmin = async () => {
  const email = env.AUTH_DEFAULT_ADMIN_EMAIL;
  const password = env.AUTH_DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    logger.info('Default admin seeding skipped — credentials not provided via environment');
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const fullName = env.AUTH_DEFAULT_ADMIN_NAME?.trim() || 'Administrator';
  const tenantId = env.AUTH_DEFAULT_ADMIN_TENANT_ID?.trim() || null;

  const adminRole = await upsertRole({
    name: ADMIN_ROLE_NAME,
    description: ADMIN_ROLE_DESCRIPTION,
    isSystemDefault: true,
  });

  const existingUser = await findUserByEmail(normalizedEmail);

  if (!existingUser) {
    const passwordHash = await bcrypt.hash(password, env.AUTH_PASSWORD_SALT_ROUNDS);
    const user = await createUser({
      email: normalizedEmail,
      passwordHash,
      fullName,
      tenantId,
      status: 'ACTIVE',
    });

    await updateUser(user.id, {
      emailVerifiedAt: new Date(),
    });

    await assignRoleToUser({
      userId: user.id,
      roleId: adminRole.id,
    });

    logger.info('Default admin user seeded', { email: normalizedEmail });
    return;
  }

  const updates = {};
  const roleAssignments = existingUser.roleAssignments ?? [];
  const alreadyHasAdminRole = roleAssignments.some((assignment) => assignment.role.name === ADMIN_ROLE_NAME);

  if (!alreadyHasAdminRole) {
    await assignRoleToUser({
      userId: existingUser.id,
      roleId: adminRole.id,
    });
    logger.info('Admin role assigned to existing default admin user', { email: normalizedEmail });
  }

  const passwordMatches = await bcrypt.compare(password, existingUser.passwordHash);
  if (!passwordMatches) {
    updates.passwordHash = await bcrypt.hash(password, env.AUTH_PASSWORD_SALT_ROUNDS);
  }

  if (existingUser.status !== 'ACTIVE') {
    updates.status = 'ACTIVE';
  }

  if (!existingUser.emailVerifiedAt) {
    updates.emailVerifiedAt = new Date();
  }

  if (fullName && existingUser.fullName !== fullName) {
    updates.fullName = fullName;
  }

  if (tenantId && existingUser.tenantId !== tenantId) {
    updates.tenantId = tenantId;
  }

  const hasUpdates = Object.keys(updates).length > 0;

  if (hasUpdates) {
    await updateUser(existingUser.id, updates);
    logger.info('Default admin user synchronised with environment configuration', { email: normalizedEmail });
  }
};

module.exports = { ensureDefaultAdmin };
