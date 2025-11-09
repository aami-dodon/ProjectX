const { requestUploadSession } = require('../services/upload.service');

const requestUpload = async (req, res, next) => {
  try {
    const { evidence, upload } = await requestUploadSession({
      payload: req.body,
      actorId: req.user?.id ?? null,
    });

    return res.status(201).json({
      data: evidence,
      upload,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requestUpload,
};
