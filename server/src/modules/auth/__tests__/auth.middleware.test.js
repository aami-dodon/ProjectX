jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../auth.repository', () => ({
  findUserById: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { findUserById } = require('../auth.repository');
const { authenticateRequest } = require('../auth.middleware');

const createRequest = (authorization = 'Bearer token') => ({
  headers: {
    authorization,
  },
});

describe('authenticateRequest middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.verify.mockReturnValue({ sub: 'user-123' });
  });

  it('rejects requests for suspended users', async () => {
    findUserById.mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      status: 'SUSPENDED',
      roleAssignments: [],
    });

    const next = jest.fn();
    await authenticateRequest(createRequest(), {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Account has been suspended',
        status: 401,
        code: 'UNAUTHORIZED',
      }),
    );
  });

  it('rejects requests when the account is not active', async () => {
    findUserById.mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      status: 'PENDING_VERIFICATION',
      roleAssignments: [],
    });

    const next = jest.fn();
    await authenticateRequest(createRequest(), {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Account is not active',
        status: 401,
        code: 'UNAUTHORIZED',
      }),
    );
  });

  it('allows active users to continue', async () => {
    findUserById.mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      status: 'ACTIVE',
      roleAssignments: [
        { role: { name: 'operator' } },
      ],
    });

    const next = jest.fn();
    const req = createRequest();
    await authenticateRequest(req, {}, next);

    expect(req.user).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      roles: ['operator'],
      status: 'ACTIVE',
    });
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

});
