const express = require('express');
const multer = require('multer');
const { uploadImageHandler } = require('./storage.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadImageHandler);

module.exports = router;
