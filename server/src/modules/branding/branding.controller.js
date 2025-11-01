const path = require('path');

const { createValidationError } = require('@/utils/errors');
const { getBrandingSettings, updateBrandingSettings } = require('./branding.service');

const fetchBranding = async (req, res, next) => {
  try {
    const branding = await getBrandingSettings();
    return res.json({ branding });
  } catch (error) {
    return next(error);
  }
};

const saveBranding = async (req, res, next) => {
  try {
    const branding = await updateBrandingSettings(req.body ?? {}, { actorId: req.user?.id });
    return res.json({ branding });
  } catch (error) {
    return next(error);
  }
};

const uploadBrandingLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createValidationError('Logo file is required', { field: 'logo' });
    }

    const logoUrl = path.posix.join('/branding', req.file.filename);
    return res.json({ logoUrl });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  fetchBranding,
  saveBranding,
  uploadBrandingLogo,
};
