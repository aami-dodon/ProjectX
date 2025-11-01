jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../auth.repository', () => ({
  findUserById: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { findUserById } = require('../auth.repository');
const { authenticateRequest, requireRoles } = require('../auth.middleware');

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

describe('requireRoles middleware', () => {
  it('rejects when authentication details are missing', () => {
    const next = jest.fn();

    requireRoles('admin')({}, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication is required',
        status: 401,
        code: 'UNAUTHORIZED',
      }),
    );
  });

  it('allows access when the user has a matching role regardless of case', () => {
    const next = jest.fn();

    const middleware = requireRoles('Admin');
    middleware({ user: { roles: ['ADMIN', 'operator'] } }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]).toHaveLength(0);
  });

  it('rejects when the user lacks the required roles', () => {
    const next = jest.fn();

    const middleware = requireRoles('admin');
    middleware({ user: { roles: ['operator'] } }, {}, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'You do not have permission to access this resource',
        status: 401,
        code: 'UNAUTHORIZED',
      }),
    );
  });
});
