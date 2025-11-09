const { recalculateControlScores } = require('../controls/scoring.service');

const recalculateScores = async (req, res, next) => {
  try {
    const result = await recalculateControlScores({
      controlIds: req.body?.controlIds ?? [],
      granularity: req.body?.granularity,
      limit: req.body?.limit,
    });
    return res.status(202).json({ data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  recalculateScores,
};
