import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Skeleton } from '../skeleton'

describe('Skeleton', () => {
  it('renders with default styling', () => {
    render(<Skeleton data-testid="skeleton" aria-label="Loading" />)

    const skeleton = screen.getByLabelText(/loading/i)
    expect(skeleton).toHaveAttribute('data-slot', 'skeleton')
    expect(skeleton).toHaveClass('animate-pulse')
  })

  it('accepts custom class names', () => {
    render(<Skeleton className="rounded-full" aria-label="Loading" />)
    expect(screen.getByLabelText(/loading/i)).toHaveClass('rounded-full')
  })

  it('forwards DOM event handlers for interaction', () => {
    const handleMouseEnter = vi.fn()
    render(<Skeleton aria-label="Loading" onMouseEnter={handleMouseEnter} />)

    fireEvent.mouseEnter(screen.getByLabelText(/loading/i))

    expect(handleMouseEnter).toHaveBeenCalledTimes(1)
  })

  it('is discoverable to assistive technology', () => {
    render(<Skeleton aria-label="Loading" />)
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
  })
})
