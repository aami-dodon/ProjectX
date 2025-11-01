const fs = require('fs');
const path = require('path');

describe('logger log directory', () => {
  it('uses the server/logs directory and ensures it exists', () => {
    const { LOG_DIR } = require('@/utils/logger');

    const expectedPath = path.join(__dirname, '..', 'logs');

    expect(LOG_DIR).toBe(expectedPath);
    expect(fs.existsSync(LOG_DIR)).toBe(true);
  });
});
