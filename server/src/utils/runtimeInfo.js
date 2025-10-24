const startedAt = new Date();

const getUptimeSeconds = () => process.uptime();

module.exports = {
  startedAt,
  getUptimeSeconds,
};
