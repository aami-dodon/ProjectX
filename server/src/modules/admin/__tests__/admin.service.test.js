const { getAdminUsers } = require('../admin.service');
const { listUsers, listRoles } = require('../admin.repository');
const { getFileAccessLink } = require('@/modules/files/file.service');

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

