import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../table'

describe('Table', () => {
  const renderTable = (props = {}) =>
    render(
      <Table {...props}>
        <TableCaption>Recent activity</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Name</TableHead>
            <TableHead scope="col">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow data-testid="table-row">
            <TableCell>Report</TableCell>
            <TableCell>Completed</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

  it('renders with default props', () => {
    renderTable()
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
  })

  it('applies custom classes to the table', () => {
    renderTable({ className: 'custom-table' })
    const table = screen.getByRole('table')
    expect(table).toHaveClass('custom-table')
  })

  it('supports row interactions', () => {
    const handleClick = vi.fn()
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow onClick={handleClick}>
            <TableCell>Report</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    fireEvent.click(screen.getByText(/report/i))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('exposes accessible row and cell roles', () => {
    renderTable()
    const table = screen.getByRole('table')
    const row = within(table).getByRole('row', { name: /report completed/i })
    expect(row).toBeInTheDocument()
    expect(within(row).getAllByRole('cell')).toHaveLength(2)
  })
})
