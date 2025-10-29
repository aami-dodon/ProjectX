import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Toggle } from '../toggle'

describe('Toggle', () => {
  it('renders with default props', () => {
    render(<Toggle aria-label="Bold" />)
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument()
  })

  it('applies custom class names', () => {
    render(<Toggle aria-label="Italic" className="custom-toggle" />)
    expect(screen.getByRole('button', { name: /italic/i })).toHaveClass('custom-toggle')
  })

  it('updates pressed state when interacted with', () => {
    const handlePressedChange = vi.fn()
    render(
      <Toggle
        aria-label="Underline"
        defaultPressed={false}
        onPressedChange={handlePressedChange}
      >
        U
      </Toggle>
    )

    const toggle = screen.getByRole('button', { name: /underline/i })
    fireEvent.click(toggle)

    expect(handlePressedChange).toHaveBeenCalledWith(true)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('exposes aria-pressed for accessibility', () => {
    render(<Toggle aria-label="Highlight" defaultPressed />)
    expect(screen.getByRole('button', { name: /highlight/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })
})
