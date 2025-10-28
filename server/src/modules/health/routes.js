const express = require('express');

const {
  getHealth,
  requestStoragePresign,
  sendTestEmailFromHealth,
} = require('./controllers/health.controller');

const router = express.Router();

router.get('/', getHealth);
router.post('/storage/presign', requestStoragePresign);
router.post('/email/test', sendTestEmailFromHealth);

module.exports = router;
