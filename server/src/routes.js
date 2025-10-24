const express = require('express');
const healthRoutes = require('./modules/health/health.routes');
const emailRoutes = require('./modules/email/email.routes');
const storageRoutes = require('./modules/storage/storage.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/email', emailRoutes);
router.use('/storage', storageRoutes);

module.exports = router;
