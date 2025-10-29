import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Input } from '../input'

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input aria-label="Email" placeholder="Email" />)
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
  })

  it('applies custom class names', () => {
    render(<Input aria-label="Name" className="custom-input" />)
    expect(screen.getByRole('textbox', { name: /name/i })).toHaveClass('custom-input')
  })

  it('handles input changes', () => {
    const handleChange = vi.fn()
    render(<Input aria-label="Username" onChange={handleChange} />)

    const input = screen.getByRole('textbox', { name: /username/i })
    fireEvent.change(input, { target: { value: 'admin' } })

    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('admin')
  })

  it('is accessible through the textbox role', () => {
    render(<Input aria-label="Project name" />)
    expect(screen.getByRole('textbox', { name: /project name/i })).toBeInTheDocument()
  })
})
