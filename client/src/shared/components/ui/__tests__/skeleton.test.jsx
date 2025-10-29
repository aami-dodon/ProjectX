import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton } from '../skeleton'

describe('Skeleton', () => {
  it('renders with base skeleton class', () => {
    const { container } = render(<Skeleton data-testid="skeleton" />)
    expect(container.firstChild).toHaveAttribute('data-slot', 'skeleton')
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('merges custom class names', () => {
    const { container } = render(<Skeleton className="rounded-full" />)
    expect(container.firstChild).toHaveClass('rounded-full')
  })
})
