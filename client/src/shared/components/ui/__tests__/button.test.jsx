import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '../button'

describe('Button', () => {
  it('renders the provided label', () => {
    render(<Button>Submit</Button>)
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('applies custom class names', () => {
    render(<Button className="custom-class">Action</Button>)
    expect(screen.getByRole('button', { name: /action/i })).toHaveClass('custom-class')
  })
})
