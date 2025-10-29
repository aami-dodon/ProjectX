import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '../button'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Submit</Button>)
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('merges custom class names', () => {
    render(<Button className="custom-class">Action</Button>)
    expect(screen.getByRole('button', { name: /action/i })).toHaveClass('custom-class')
  })

  it('handles click interactions', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Interact</Button>)

    fireEvent.click(screen.getByRole('button', { name: /interact/i }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('exposes an accessible button role', () => {
    render(<Button aria-label="Save changes" />)

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
