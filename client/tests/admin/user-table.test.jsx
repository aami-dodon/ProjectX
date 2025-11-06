import * as React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/components/data-table', () => ({
  DataTable: () => null,
  DataTableRowDrawer: ({ renderView, renderHeader, headerActions, item }) => {
    const close = vi.fn()
    const setTab = vi.fn()
    const actions = headerActions ? headerActions({ item, close, setTab }) : null

    return (
      <div>
        <div data-testid="drawer-header">
          {renderHeader
            ? renderHeader({ item, close, setTab, headerActions: actions })
            : null}
        </div>
        <div data-testid="drawer-view">
          {renderView ? renderView({ item, close, setTab }) : null}
        </div>
      </div>
    )
  },
}))

vi.mock('@/shared/components/ui/avatar', () => ({
  Avatar: ({ children }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ children, ...props }) => (
    <img data-testid="avatar-image" {...props}>
      {children}
    </img>
  ),
  AvatarFallback: ({ children }) => <span data-testid="avatar-fallback">{children}</span>,
}))

import { TableCellViewer } from '@/features/admin/user-management/components/table/UserTable'

describe('TableCellViewer', () => {
  it('renders drawer header with avatar, email, and status details', () => {
    render(
      <TableCellViewer
        item={{
          id: 'user-1',
          fullName: 'Alice Example',
          email: 'alice@example.com',
          status: 'ACTIVE',
          roles: [],
          avatarUrl: 'https://files.example.com/alice.png',
          emailVerifiedAt: '2024-05-01T00:00:00.000Z',
          lastLoginAt: '2024-05-02T00:00:00.000Z',
          createdAt: '2024-01-01T08:30:00.000Z',
          updatedAt: '2024-05-03T13:15:00.000Z',
          mfaEnabled: true,
        }}
        availableRoles={[]}
        onUpdate={vi.fn()}
        openUserId={null}
        activeDrawerTab="view"
        onDrawerOpenChange={vi.fn()}
      />
    )

    const header = screen.getByTestId('drawer-header')
    const view = screen.getByTestId('drawer-view')

    const avatarImage = within(header).getByTestId('avatar-image')
    expect(avatarImage).toHaveAttribute('src', 'https://files.example.com/alice.png')
    expect(avatarImage).toHaveAttribute('alt', 'Alice Example avatar')
    expect(within(header).getByText('alice@example.com')).toBeInTheDocument()
    expect(within(header).getByText('Active')).toBeInTheDocument()
    expect(within(header).getByText('Verified')).toBeInTheDocument()
    expect(within(header).queryByRole('button', { name: /verify email/i })).not.toBeInTheDocument()

    expect(within(view).getByText('alice@example.com')).toBeInTheDocument()
    expect(within(view).getByText(/Verified on/i)).toBeInTheDocument()
    expect(within(view).getByText('Created')).toBeInTheDocument()
    expect(
      within(view).getByText(new Date('2024-01-01T08:30:00.000Z').toLocaleString())
    ).toBeInTheDocument()
    expect(within(view).getByText('Last updated')).toBeInTheDocument()
    expect(
      within(view).getByText(new Date('2024-05-03T13:15:00.000Z').toLocaleString())
    ).toBeInTheDocument()
    expect(within(view).getByText('Last login')).toBeInTheDocument()
    expect(
      within(view).getByText(new Date('2024-05-02T00:00:00.000Z').toLocaleString())
    ).toBeInTheDocument()
    expect(within(view).getByText('MFA')).toBeInTheDocument()
    expect(within(view).getByText('Enabled')).toBeInTheDocument()
  })

  it('falls back when avatarUrl is missing', () => {
    render(
      <TableCellViewer
        item={{
          id: 'user-2',
          fullName: 'Bob Example',
          email: 'bob@example.com',
          status: 'INVITED',
          roles: [],
          createdAt: null,
          updatedAt: undefined,
          lastLoginAt: null,
          mfaEnabled: null,
        }}
        availableRoles={[]}
        onUpdate={vi.fn()}
        openUserId={null}
        activeDrawerTab="view"
        onDrawerOpenChange={vi.fn()}
      />
    )

    const header = screen.getByTestId('drawer-header')
    const view = screen.getByTestId('drawer-view')

    const avatarImage = within(header).getByTestId('avatar-image')
    expect(avatarImage).toHaveAttribute('alt', 'Bob Example avatar')
    expect(avatarImage).not.toHaveAttribute('src')
    expect(within(header).getByText('BE')).toBeInTheDocument()
    expect(within(header).getByText('Not verified')).toBeInTheDocument()
    expect(within(header).getByRole('button', { name: /verify email/i })).toBeInTheDocument()

    expect(within(view).getByText('Not verified')).toBeInTheDocument()
    expect(within(view).getByText('Created')).toBeInTheDocument()
    expect(within(view).getByText('Last updated')).toBeInTheDocument()
    expect(within(view).getByText('Last login')).toBeInTheDocument()
    const fallbacks = within(view).getAllByText('—')
    expect(fallbacks.length).toBeGreaterThanOrEqual(3)
    expect(within(view).getByText('MFA')).toBeInTheDocument()
    expect(fallbacks.length).toBeGreaterThan(0)
  })
})
