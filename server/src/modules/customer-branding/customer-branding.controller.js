const { getBrandingSettings, updateBrandingSettings } = require('./customer-branding.service');

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

module.exports = {
  fetchBranding,
  saveBranding,
};
