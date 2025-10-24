const test = require('node:test');
const assert = require('node:assert/strict');
const { createCorsOptions } = require('../corsOptions');

const execOriginCheck = (options, requestOrigin) =>
  new Promise((resolve, reject) => {
    options.origin(requestOrigin, (error, allowed) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(allowed);
    });
  });

test('allows origins present in the list (ignores trailing slash)', async () => {
  const options = createCorsOptions(['http://localhost:5173/']);
  const allowed = await execOriginCheck(options, 'http://localhost:5173');
  assert.equal(allowed, true);
});

test('blocks origins that are not configured', async () => {
  const options = createCorsOptions(['http://localhost:5173']);
  const allowed = await execOriginCheck(options, 'http://localhost:6007');
  assert.equal(allowed, false);
});

test('allows any origin when wildcard is configured', async () => {
  const options = createCorsOptions(['*']);
  const allowed = await execOriginCheck(options, 'https://example.com');
  assert.equal(allowed, true);
});

test('treats missing origin header as allowed', async () => {
  const options = createCorsOptions(['http://localhost:5173']);
  const allowed = await execOriginCheck(options, undefined);
  assert.equal(allowed, true);
});

test('permits null origins when explicitly allowed', async () => {
  const options = createCorsOptions(['null']);
  const allowed = await execOriginCheck(options, 'null');
  assert.equal(allowed, true);
});
