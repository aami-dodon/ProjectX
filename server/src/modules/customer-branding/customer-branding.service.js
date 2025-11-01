const { z } = require('zod');

const { createValidationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const { getFileAccessLink } = require('@/modules/files/file.service');
const { findBrandingSettings, upsertBrandingSettings } = require('./customer-branding.repository');

const logger = createLogger('customer-branding-service');

const SEARCH_PLACEHOLDER = 'Search the workspace...';

const DEFAULT_BRANDING = {
  name: 'Acme Inc.',
  sidebarTitle: 'Customer Name',
  logoUrl: null,
  logoObjectName: null,
  searchPlaceholder: SEARCH_PLACEHOLDER,
};

const LEGACY_DEFAULT_LOGO = '/favicon.svg';

const logoObjectNameSchema = z
  .string()
  .trim()
  .min(1, 'Logo object name must be provided when present')
  .max(300, 'Logo object name is too long');

const updateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Workspace name is required')
    .max(120, 'Workspace name must be 120 characters or fewer'),
  sidebarTitle: z
    .string()
    .trim()
    .min(1, 'Customer name is required')
    .max(120, 'Customer name must be 120 characters or fewer'),
  logoObjectName: z.union([logoObjectNameSchema, z.literal(null)]).optional(),
});

function normalizeLogoObjectName(objectName) {
  const trimmed = objectName.trim();
  if (!trimmed) {
    throw createValidationError('Logo must reference an uploaded branding asset', {
      field: 'logoObjectName',
    });
  }

  return trimmed.replace(/^\/+/, '');
}

function parseLogoObjectName(objectName) {
  const normalized = normalizeLogoObjectName(objectName);
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length < 4) {
    throw createValidationError('Logo must reference an uploaded branding asset', {
      field: 'logoObjectName',
    });
  }

  const [root, category, ownerSegment] = segments;

  if (root !== 'uploads' || category !== 'images') {
    throw createValidationError('Logo must reference an uploaded branding asset', {
      field: 'logoObjectName',
    });
  }

  if (!ownerSegment) {
    throw createValidationError('Logo must reference an uploaded branding asset', {
      field: 'logoObjectName',
    });
  }

  let ownerId;
  try {
    ownerId = decodeURIComponent(ownerSegment);
  } catch {
    throw createValidationError('Logo must reference an uploaded branding asset', {
      field: 'logoObjectName',
    });
  }

  if (!ownerId.trim()) {
    throw createValidationError('Logo must reference an uploaded branding asset', {
      field: 'logoObjectName',
    });
  }

  return { normalized, ownerId };
}

function mergeBranding(record, overrides = {}) {
  if (!record) {
    return { ...DEFAULT_BRANDING };
  }

  const legacyLogoUrl =
    record.logoUrl === LEGACY_DEFAULT_LOGO ? null : record.logoUrl ?? DEFAULT_BRANDING.logoUrl;
  const resolvedLogoUrl = overrides.logoUrl ?? legacyLogoUrl ?? DEFAULT_BRANDING.logoUrl;

  return {
    name: record.name ?? DEFAULT_BRANDING.name,
    sidebarTitle: record.sidebarTitle ?? DEFAULT_BRANDING.sidebarTitle,
    searchPlaceholder: SEARCH_PLACEHOLDER,
    logoUrl: resolvedLogoUrl,
    logoObjectName: record.logoObjectName ?? null,
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
  };
}

async function getBrandingSettings() {
  const current = await findBrandingSettings();

  if (!current?.logoObjectName) {
    return mergeBranding(current);
  }

  try {
    const { normalized, ownerId } = parseLogoObjectName(current.logoObjectName);
    const { url } = await getFileAccessLink(normalized, ownerId);
    return mergeBranding(current, { logoUrl: url });
  } catch (error) {
    logger.warn('Failed to resolve customer branding logo download URL', {
      error: error?.message ?? error,
    });
    return mergeBranding(current, { logoUrl: null });
  }
}

async function updateBrandingSettings(updates, { actorId } = {}) {
  const parsed = updateSchema.safeParse(updates ?? {});

  if (!parsed.success) {
    const issue = parsed.error.issues?.[0];
    if (issue) {
      throw createValidationError(issue.message, { field: issue.path?.[0] });
    }

    throw createValidationError('Invalid branding payload provided');
  }

  const current = await findBrandingSettings();

  let nextLogoObjectName = current?.logoObjectName ?? null;

  if (Object.prototype.hasOwnProperty.call(parsed.data, 'logoObjectName')) {
    const candidate = parsed.data.logoObjectName;

    if (candidate === null) {
      nextLogoObjectName = null;
    } else {
      const { normalized, ownerId } = parseLogoObjectName(candidate);
      await getFileAccessLink(normalized, ownerId);
      nextLogoObjectName = normalized;
    }
  }

  const payload = {
    name: parsed.data.name,
    sidebarTitle: parsed.data.sidebarTitle,
    searchPlaceholder: SEARCH_PLACEHOLDER,
    logoObjectName: nextLogoObjectName,
  };

  await upsertBrandingSettings(payload);

  if (actorId) {
    logger.info('Customer branding settings updated', { actorId });
  } else {
    logger.info('Customer branding settings updated');
  }

  return getBrandingSettings();
}

module.exports = {
  DEFAULT_BRANDING,
  getBrandingSettings,
  updateBrandingSettings,
  mergeBranding,
};
