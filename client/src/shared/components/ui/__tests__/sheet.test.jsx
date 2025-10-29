import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '../sheet'

describe('Sheet', () => {
  const renderSheet = (contentProps = {}) =>
    render(
      <Sheet>
        <SheetTrigger>Open settings</SheetTrigger>
        <SheetContent aria-label="Settings" {...contentProps}>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Update your preferences</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )

  it('renders the trigger button by default', () => {
    renderSheet()
    expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('applies custom class names to the sheet content', () => {
    renderSheet({ className: 'custom-sheet' })
    fireEvent.click(screen.getByRole('button', { name: /open settings/i }))
    expect(screen.getByRole('dialog', { name: /settings/i })).toHaveClass('custom-sheet')
  })

  it('supports opening and closing interactions', async () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: /open settings/i }))
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument()
    )
  })

  it('exposes dialog semantics for accessibility', () => {
    renderSheet()
    fireEvent.click(screen.getByRole('button', { name: /open settings/i }))
    expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument()
  })
})
