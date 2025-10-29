const express = require('express');

const { authenticateRequest } = require('@/modules/auth/auth.middleware');
const { requestDownloadUrl, requestUploadUrl } = require('./file.controller');

const router = express.Router();

router.get('/upload-url', authenticateRequest, requestUploadUrl);
router.get('/download-url', authenticateRequest, requestDownloadUrl);

module.exports = router;
