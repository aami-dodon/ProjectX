const express = require('express');
const { buildHealthResponse } = require('./health.service');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const payload = await buildHealthResponse(req.app);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
