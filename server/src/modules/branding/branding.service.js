const path = require('path');
const { z } = require('zod');

const { createValidationError } = require('@/utils/errors');
const { createLogger } = require('@/utils/logger');
const { findBrandingSettings, upsertBrandingSettings } = require('./branding.repository');

const logger = createLogger('branding-service');

const DEFAULT_BRANDING = {
  name: 'Acme Inc.',
  sidebarTitle: 'Acme Inc.',
  logoUrl: null,
  searchPlaceholder: 'Search the workspace...',
};

const BRANDING_UPLOAD_DIR = path.resolve(__dirname, '../../../..', 'client', 'public', 'branding');
const LEGACY_DEFAULT_LOGO = '/favicon.svg';
const ALLOWED_LOGO_PREFIXES = ['/branding/'];

const logoUrlSchema = z
  .string()
  .trim()
  .min(1, 'Logo URL must be provided when present')
  .max(300, 'Logo URL is too long');

const updateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Workspace name is required')
    .max(120, 'Workspace name must be 120 characters or fewer'),
  sidebarTitle: z
    .string()
    .trim()
    .min(1, 'Sidebar title is required')
    .max(120, 'Sidebar title must be 120 characters or fewer'),
  searchPlaceholder: z
    .string()
    .trim()
    .min(1, 'Search placeholder is required')
    .max(160, 'Search placeholder must be 160 characters or fewer'),
  logoUrl: z.union([logoUrlSchema, z.literal(null)]).optional(),
});

function mergeBranding(record) {
  if (!record) {
    return { ...DEFAULT_BRANDING };
  }

  const logoUrl = record.logoUrl === LEGACY_DEFAULT_LOGO ? DEFAULT_BRANDING.logoUrl : record.logoUrl;

  return {
    name: record.name ?? DEFAULT_BRANDING.name,
    sidebarTitle: record.sidebarTitle ?? DEFAULT_BRANDING.sidebarTitle,
    logoUrl: logoUrl ?? DEFAULT_BRANDING.logoUrl,
    searchPlaceholder: record.searchPlaceholder ?? DEFAULT_BRANDING.searchPlaceholder,
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
  };
}

async function getBrandingSettings() {
  const current = await findBrandingSettings();
  return mergeBranding(current);
}

function resolveLogoPath(logoUrl, fallback) {
  if (logoUrl === null) {
    return null;
  }

  if (typeof logoUrl === 'string') {
    const normalized = logoUrl.trim();
    if (normalized === LEGACY_DEFAULT_LOGO) {
      return null;
    }
    if (!normalized.startsWith('/')) {
      throw createValidationError('Logo URL must be relative to the public root', { field: 'logoUrl' });
    }

    const isAllowed = ALLOWED_LOGO_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix));
    if (!isAllowed) {
      throw createValidationError('Logo URL must reference an uploaded branding asset', { field: 'logoUrl' });
    }

    return normalized;
  }

  if (fallback === LEGACY_DEFAULT_LOGO) {
    return null;
  }

  return fallback ?? DEFAULT_BRANDING.logoUrl;
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
  const logoUrl = resolveLogoPath(parsed.data.logoUrl, current?.logoUrl);

  const payload = {
    name: parsed.data.name,
    sidebarTitle: parsed.data.sidebarTitle,
    searchPlaceholder: parsed.data.searchPlaceholder,
    logoUrl,
  };

  const record = await upsertBrandingSettings(payload);

  if (actorId) {
    logger.info('Branding settings updated', { actorId });
  } else {
    logger.info('Branding settings updated');
  }

  return mergeBranding(record);
}

module.exports = {
  DEFAULT_BRANDING,
  BRANDING_UPLOAD_DIR,
  getBrandingSettings,
  updateBrandingSettings,
  mergeBranding,
};
