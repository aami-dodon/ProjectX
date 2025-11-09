const { listReviewQueue } = require('../checks/review-queue.service');
const { completeReviewTask } = require('../checks/lifecycle.service');

const listQueueItems = async (req, res, next) => {
  try {
    const data = await listReviewQueue(req.query ?? {});
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const completeQueueItem = async (req, res, next) => {
  try {
    const result = await completeReviewTask({
      itemId: req.params?.itemId,
      payload: req.body ?? {},
      actorId: req.user?.id ?? null,
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  completeQueueItem,
  listQueueItems,
};
