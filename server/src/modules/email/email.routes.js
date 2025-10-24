const express = require('express');
const { sendTestEmailHandler } = require('./email.controller');

const router = express.Router();

router.post('/test', sendTestEmailHandler);

module.exports = router;
