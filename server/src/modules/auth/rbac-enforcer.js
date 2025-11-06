const fs = require('fs/promises');
const path = require('path');

const { newEnforcer, Util } = require('casbin');

const { env } = require('@/config/env');
const { prisma } = require('@/integrations/prisma');
const { createLogger } = require('@/utils/logger');
const { PrismaCasbinAdapter, GLOBAL_DOMAIN } = require('./casbin-adapter');

const logger = createLogger('rbac-enforcer');

let enforcerInstance = null;
let lastLoadedAt = 0;
let loadingPromise = null;

const resolvePath = (maybeRelativePath) => {
  if (!maybeRelativePath) {
    return null;
  }

  if (path.isAbsolute(maybeRelativePath)) {
    return maybeRelativePath;
  }

  return path.join(process.cwd(), maybeRelativePath);
};

const seedPoliciesIfEmpty = async () => {
  const policyCount = await prisma.authPolicy.count();
  if (policyCount > 0) {
    return;
  }

  const seedPath = resolvePath(env.AUTH_RBAC_POLICY_SEED_PATH);
  if (!seedPath) {
    return;
  }

  try {
    const contents = await fs.readFile(seedPath, 'utf-8');
    const parsed = JSON.parse(contents);
    if (!Array.isArray(parsed)) {
      throw new Error('policy seed file must contain an array of policies');
    }

    if (parsed.length === 0) {
      return;
    }

    await prisma.$transaction(
      parsed.map((policy) =>
        prisma.authPolicy.create({
          data: {
            type: policy.type ?? 'p',
            subject: policy.subject ?? null,
            domain: policy.domain ?? GLOBAL_DOMAIN,
            object: policy.object ?? null,
            action: policy.action ?? null,
            effect: policy.effect ?? 'allow',
            description: policy.description ?? null,
            metadata: policy.metadata ?? null,
          },
        })
      )
    );

    logger.info('Seeded default RBAC policies', { count: parsed.length });
  } catch (error) {
    logger.error('Failed to seed RBAC policies', { error: error.message, seedPath });
  }
};

const buildEnforcer = async () => {
  const modelPath = resolvePath(env.AUTH_RBAC_MODEL_PATH);
  if (!modelPath) {
    throw new Error('AUTH_RBAC_MODEL_PATH is not configured');
  }

  await fs.access(modelPath);
  await seedPoliciesIfEmpty();

  const adapter = new PrismaCasbinAdapter();
  const enforcer = await newEnforcer(modelPath, adapter);

  const keyMatch2 = Util.keyMatch2Func || Util.keyMatchFunc || Util.keyMatch2;
  const regexMatch = Util.regexMatchFunc || Util.regexMatch;
  if (typeof keyMatch2 === 'function') {
    enforcer.addFunction('keyMatch2', keyMatch2);
  }
  if (typeof regexMatch === 'function') {
    enforcer.addFunction('regexMatch', regexMatch);
  }

  lastLoadedAt = Date.now();
  logger.info('RBAC enforcer initialised', { modelPath });
  return enforcer;
};

const shouldReload = () => {
  if (!enforcerInstance) {
    return true;
  }

  const ttlMs = Number(env.AUTH_RBAC_CACHE_TTL_SECONDS || 300) * 1000;
  return Date.now() - lastLoadedAt > ttlMs;
};

const getEnforcer = async ({ forceReload = false } = {}) => {
  if (!loadingPromise && (forceReload || shouldReload())) {
    loadingPromise = buildEnforcer()
      .then((enforcer) => {
        enforcerInstance = enforcer;
        loadingPromise = null;
        return enforcerInstance;
      })
      .catch((error) => {
        loadingPromise = null;
        logger.error('Failed to build RBAC enforcer', {
          error: error.message,
          stack: error.stack,
        });
        throw error;
      });
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  return enforcerInstance;
};

const invalidateEnforcer = async (reason = 'unknown') => {
  logger.debug('Invalidating RBAC enforcer', { reason });
  enforcerInstance = null;
  lastLoadedAt = 0;
  return getEnforcer({ forceReload: true }).catch((error) => {
    logger.warn('Failed to rebuild RBAC enforcer during invalidation', {
      error: error.message,
      stack: error.stack,
    });
  });
};

const ensureEnforcer = () => getEnforcer({ forceReload: true });

module.exports = {
  getEnforcer,
  invalidateEnforcer,
  ensureEnforcer,
};
