const { requestDownloadLink } = require('../services/download.service');

const requestDownload = async (req, res, next) => {
  try {
    const payload = await requestDownloadLink({
      evidenceId: req.params?.evidenceId,
      actorId: req.user?.id ?? null,
    });

    return res.json({ data: payload });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  requestDownload,
};
