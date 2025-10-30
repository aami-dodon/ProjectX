import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/components/data-table', () => ({
  DataTable: () => null,
  DataTableRowDrawer: ({ renderView, item }) => (
    <div data-testid="drawer-view">{renderView({ item, close: vi.fn(), setTab: vi.fn() })}</div>
  ),
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

import { TableCellViewer } from '../UserTable'

describe('TableCellViewer', () => {
  it('renders the avatar image using avatarUrl', () => {
    render(
      <TableCellViewer
        item={{
          id: 'user-1',
          fullName: 'Alice Example',
          email: 'alice@example.com',
          status: 'ACTIVE',
          roles: [],
          avatarUrl: 'https://files.example.com/alice.png',
        }}
        availableRoles={[]}
        onUpdate={vi.fn()}
      />
    )

    const avatarImage = screen.getByTestId('avatar-image')
    expect(avatarImage).toHaveAttribute('src', 'https://files.example.com/alice.png')
    expect(avatarImage).toHaveAttribute('alt', 'Alice Example avatar')
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
        }}
        availableRoles={[]}
        onUpdate={vi.fn()}
      />
    )

    const avatarImage = screen.getByTestId('avatar-image')
    expect(avatarImage).toHaveAttribute('alt', 'Bob Example avatar')
    expect(avatarImage).not.toHaveAttribute('src')
    expect(screen.getByText('BE')).toBeInTheDocument()
  })
})

