const {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
} = require('./auth.service');
const { createLogger } = require('@/utils/logger');

const logger = createLogger('auth-controller');

const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body ?? {});
    return res.status(201).json({ user });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
    const result = await loginUser({ ...(req.body ?? {}), metadata });
    return res.json(result);
  } catch (error) {
    logger.warn('Login failed', { error: error.message });
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await logoutUser(req.body ?? {});
    return res.json(result);
  } catch (error) {
    logger.warn('Logout failed', { error: error.message });
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
    const result = await refreshSession({ ...(req.body ?? {}), metadata });
    return res.json(result);
  } catch (error) {
    logger.warn('Token refresh failed', { error: error.message });
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await requestPasswordReset(req.body ?? {});
    return res.json(result);
  } catch (error) {
    logger.warn('Password reset request failed', { error: error.message });
    return next(error);
  }
};

const resetPasswordHandler = async (req, res, next) => {
  try {
    const result = await resetPassword(req.body ?? {});
    return res.json(result);
  } catch (error) {
    logger.warn('Password reset failed', { error: error.message });
    return next(error);
  }
};

const changePasswordHandler = async (req, res, next) => {
  try {
    const result = await changePassword({
      userId: req.user?.id,
      currentPassword: req.body?.currentPassword,
      newPassword: req.body?.newPassword,
    });
    return res.json(result);
  } catch (error) {
    logger.warn('Authenticated password change failed', { error: error.message });
    return next(error);
  }
};

const verifyEmailHandler = async (req, res, next) => {
  try {
    const user = await verifyEmail(req.body ?? {});
    return res.json({ user });
  } catch (error) {
    logger.warn('Email verification failed', { error: error.message });
    return next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await getCurrentUserProfile({
      userId: req.user?.id,
    });
    return res.json({ user });
  } catch (error) {
    logger.warn('Profile retrieval failed', { error: error.message });
    return next(error);
  }
};

const updateCurrentUser = async (req, res, next) => {
  try {
    const user = await updateUserProfile({
      userId: req.user?.id,
      profileUpdates: req.body ?? {},
    });
    return res.json({ user });
  } catch (error) {
    logger.warn('Profile update failed', { error: error.message });
    return next(error);
  }
};

module.exports = {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  resetPassword: resetPasswordHandler,
  changePassword: changePasswordHandler,
  verifyEmail: verifyEmailHandler,
  getCurrentUser,
  updateCurrentUser,
};
