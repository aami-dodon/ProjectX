const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');

const { authenticateRequest, requireRoles } = require('@/modules/auth/auth.middleware');
const { attachAuditContext } = require('@/middleware/audit-context');
const { createValidationError } = require('@/utils/errors');
const {
  BRANDING_UPLOAD_DIR,
} = require('./branding.service');
const {
  fetchBranding,
  saveBranding,
  uploadBrandingLogo,
} = require('./branding.controller');

const router = express.Router();

const ALLOWED_MIME_TYPES = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/svg+xml', '.svg'],
  ['image/webp', '.webp'],
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(BRANDING_UPLOAD_DIR, { recursive: true })
      .then(() => cb(null, BRANDING_UPLOAD_DIR))
      .catch((error) => cb(error));
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ALLOWED_MIME_TYPES.get(file.mimetype) || '.png';
    const uniqueName = `logo-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error('UNSUPPORTED_FILE_TYPE');
    error.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(error);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

const handleLogoUpload = (req, res, next) => {
  upload.single('logo')(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(createValidationError('Logo must be 2MB or smaller', { field: 'logo' }));
      }

      if (error.code === 'UNSUPPORTED_FILE_TYPE') {
        return next(createValidationError('Logo must be a PNG, SVG, JPEG, or WebP image', { field: 'logo' }));
      }

      return next(error);
    }

    return uploadBrandingLogo(req, res, next);
  });
};

router.get('/', fetchBranding);
router.put('/', authenticateRequest, attachAuditContext, requireRoles('admin'), saveBranding);
router.post(
  '/logo',
  authenticateRequest,
  attachAuditContext,
  requireRoles('admin'),
  handleLogoUpload,
);

module.exports = router;
