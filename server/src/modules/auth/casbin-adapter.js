const { Helper } = require('casbin');

const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('casbin-adapter');

const GLOBAL_DOMAIN = 'global';

class PrismaCasbinAdapter {
  async loadPolicy(model) {
    const buildLine = (ptype, ruleParts = []) => {
      const parts = [ptype, ...ruleParts.filter((part) => part !== undefined && part !== null)];
      return parts.join(', ');
    };

    const policies = await prisma.authPolicy.findMany({
      where: {
        deletedAt: null,
      },
    });

    policies.forEach((policy) => {
      if (!policy.type) {
        return;
      }

      const line = buildLine(policy.type, [
        policy.subject ?? '',
        policy.domain ?? GLOBAL_DOMAIN,
        policy.object ?? '',
        policy.action ?? '',
        policy.effect ?? 'allow',
      ]);

      Helper.loadPolicyLine(line, model);
    });

    const assignments = await prisma.authRoleAssignment.findMany({
      where: {
        revokedAt: null,
      },
      include: {
        role: true,
      },
    });

    assignments.forEach((assignment) => {
      if (!assignment.role) {
        return;
      }

      const line = buildLine('g', [
        assignment.userId,
        assignment.role.name,
        assignment.domain ?? assignment.role.domain ?? GLOBAL_DOMAIN,
      ]);

      Helper.loadPolicyLine(line, model);
    });

    const inheritances = await prisma.authRole.findMany({
      where: {
        archivedAt: null,
        inheritsRoleId: {
          not: null,
        },
      },
      include: {
        inheritsRole: true,
      },
    });

    inheritances.forEach((role) => {
      if (!role.inheritsRole) {
        return;
      }

      const line = buildLine('g', [
        role.name,
        role.inheritsRole.name,
        role.domain ?? role.inheritsRole.domain ?? GLOBAL_DOMAIN,
      ]);

      Helper.loadPolicyLine(line, model);
    });

    logger.debug('Casbin policies loaded', {
      policyCount: policies.length,
      assignmentCount: assignments.length,
      inheritanceCount: inheritances.length,
    });
  }

  // The following adapter methods are intentionally no-ops because we
  // mutate policy state via dedicated services that persist to Prisma.
  async savePolicy() {
    return true;
  }

  async addPolicy() {
    return true;
  }

  async removePolicy() {
    return true;
  }

  async removeFilteredPolicy() {
    return true;
  }
}

module.exports = {
  PrismaCasbinAdapter,
  GLOBAL_DOMAIN,
};
