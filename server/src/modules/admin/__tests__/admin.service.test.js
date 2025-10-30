const { getAdminUsers, updateUserAccount } = require('../admin.service');
const {
  listUsers,
  listRoles,
  updateUserById,
  findUserById,
  findRolesByIds,
} = require('../admin.repository');
const { getFileAccessLink } = require('@/modules/files/file.service');
const { logAuthEvent } = require('@/modules/auth/auth.repository');

jest.mock('../admin.repository', () => ({
  listUsers: jest.fn(),
  listRoles: jest.fn(),
  updateUserById: jest.fn(),
  findUserById: jest.fn(),
  findRolesByIds: jest.fn(),
}));

jest.mock('@/modules/files/file.service', () => ({
  getFileAccessLink: jest.fn(),
}));

jest.mock('@/modules/auth/auth.repository', () => ({
  logAuthEvent: jest.fn(),
}));

const buildUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'user1@example.com',
  fullName: 'User One',
  avatarObjectName: 'avatars/user-1.png',
  status: 'ACTIVE',
  emailVerifiedAt: null,
  lastLoginAt: null,
  mfaEnabled: false,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  roleAssignments: [
    {
      role: {
        id: 'role-1',
        name: 'Admin',
        description: 'Administrator',
      },
    },
  ],
  ...overrides,
});

describe('admin.service - getAdminUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enriches users with avatar URLs when an avatar object exists', async () => {
    const users = [
      buildUser(),
      buildUser({
        id: 'user-2',
        email: 'user2@example.com',
        fullName: 'User Two',
        avatarObjectName: null,
        status: 'INVITED',
        roleAssignments: [],
      }),
    ];

    listUsers.mockResolvedValue(users);
    listRoles.mockResolvedValue([
      { id: 'role-1', name: 'Admin', description: 'Administrator', isSystemDefault: false },
    ]);
    getFileAccessLink.mockResolvedValue({ url: 'https://files.example.com/avatar-user-1.png' });

    const result = await getAdminUsers();

    expect(getFileAccessLink).toHaveBeenCalledTimes(1);
    expect(getFileAccessLink).toHaveBeenCalledWith('avatars/user-1.png', 'user-1');

    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toMatchObject({
      id: 'user-1',
      avatarObjectName: 'avatars/user-1.png',
      avatarUrl: 'https://files.example.com/avatar-user-1.png',
    });
    expect(result.users[1]).toMatchObject({
      id: 'user-2',
      avatarObjectName: null,
      avatarUrl: null,
    });
  });

  it('falls back to null when generating an avatar URL fails', async () => {
    const users = [buildUser()];

    listUsers.mockResolvedValue(users);
    listRoles.mockResolvedValue([]);
    getFileAccessLink.mockRejectedValue(new Error('MinIO unavailable'));

    const result = await getAdminUsers();

    expect(getFileAccessLink).toHaveBeenCalledWith('avatars/user-1.png', 'user-1');
    expect(result.users[0].avatarUrl).toBeNull();
  });
});

describe('admin.service - updateUserAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes email updates and resets verification', async () => {
    const existing = buildUser();
    findUserById.mockResolvedValue(existing);
    const updated = buildUser({ email: 'new@example.com', emailVerifiedAt: null });
    updateUserById.mockResolvedValue(updated);

    const result = await updateUserAccount({
      userId: 'user-1',
      updates: { email: 'NEW@Example.com ' },
      actorId: 'admin-42',
    });

    expect(updateUserById).toHaveBeenCalledWith('user-1', {
      email: 'new@example.com',
      emailVerifiedAt: null,
    });
    expect(result).toMatchObject({
      id: 'user-1',
      email: 'new@example.com',
      emailVerifiedAt: null,
    });
    expect(logAuthEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      eventType: 'admin.user.updated',
      payload: {
        actorId: 'admin-42',
        fields: ['email', 'emailVerifiedAt'],
      },
    });
  });

  it('marks a user email as verified', async () => {
    const existing = buildUser();
    findUserById.mockResolvedValue(existing);
    const verifiedAt = new Date('2024-06-01T12:00:00Z');
    updateUserById.mockResolvedValue(
      buildUser({ emailVerifiedAt: verifiedAt })
    );

    const result = await updateUserAccount({
      userId: 'user-1',
      updates: { verifyEmail: true },
      actorId: 'admin-99',
    });

    expect(updateUserById).toHaveBeenCalledWith('user-1', {
      emailVerifiedAt: expect.any(Date),
    });
    expect(result.emailVerifiedAt).toEqual(verifiedAt);
    expect(logAuthEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      eventType: 'admin.user.updated',
      payload: {
        actorId: 'admin-99',
        fields: ['emailVerifiedAt'],
      },
    });
  });

  it('automatically verifies email when activating a user', async () => {
    const verifiedAt = new Date('2024-07-01T08:00:00Z');
    updateUserById.mockResolvedValue(
      buildUser({ status: 'ACTIVE', emailVerifiedAt: verifiedAt })
    );

    const result = await updateUserAccount({
      userId: 'user-1',
      updates: { status: 'active' },
      actorId: 'admin-50',
    });

    expect(updateUserById).toHaveBeenCalledWith('user-1', {
      status: 'ACTIVE',
      emailVerifiedAt: expect.any(Date),
    });
    expect(result).toMatchObject({
      status: 'ACTIVE',
      emailVerifiedAt: verifiedAt,
    });
    expect(logAuthEvent).toHaveBeenCalledWith({
      userId: 'user-1',
      eventType: 'admin.user.updated',
      payload: {
        actorId: 'admin-50',
        fields: ['status', 'emailVerifiedAt'],
      },
    });
  });

  it('throws a validation error when email is invalid', async () => {
    await expect(
      updateUserAccount({ userId: 'user-1', updates: { email: 'invalid-email' } })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { field: 'email' },
    });
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('prevents administrators from modifying their own roles', async () => {
    const existing = buildUser({ id: 'admin-1' });
    findUserById.mockResolvedValue(existing);

    await expect(
      updateUserAccount({
        userId: 'admin-1',
        updates: { roleIds: [] },
        actorId: 'admin-1',
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { field: 'roleIds' },
    });

    expect(updateUserById).not.toHaveBeenCalled();
    expect(logAuthEvent).not.toHaveBeenCalled();
    expect(findRolesByIds).not.toHaveBeenCalled();
  });
});

