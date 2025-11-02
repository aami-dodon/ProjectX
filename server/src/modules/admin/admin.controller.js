const { getAdminUsers, updateUserAccount } = require('./admin.service');

const listUsers = async (req, res, next) => {
  try {
    const data = await getAdminUsers({
      search: req.query?.search,
      status: req.query?.status,
      limit: req.query?.limit,
      offset: req.query?.offset,
      page: req.query?.page,
      pageSize: req.query?.pageSize,
      sort: req.query?.sort,
      filter: req.query?.filter,
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await updateUserAccount({
      userId: req.params?.userId,
      updates: req.body ?? {},
      actorId: req.user?.id ?? null,
    });

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listUsers,
  updateUser,
};
