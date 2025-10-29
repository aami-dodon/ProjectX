import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../card'

describe('Card', () => {
  it('renders its sections with default props', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Personal details</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText(/account/i)).toBeInTheDocument()
    expect(screen.getByText(/personal details/i)).toBeInTheDocument()
    expect(screen.getByText(/body/i)).toBeInTheDocument()
    expect(screen.getByText(/footer/i)).toBeInTheDocument()
  })

  it('accepts custom class names on the root', () => {
    render(<Card className="shadow-xl">Content</Card>)
    expect(screen.getByText(/content/i).closest('[data-slot="card"]').className).toContain('shadow-xl')
  })

  it('handles click interactions', () => {
    const handleClick = vi.fn()
    render(
      <Card onClick={handleClick}>
        <CardAction>Action</CardAction>
      </Card>
    )

    fireEvent.click(screen.getByText(/action/i))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be announced to assistive technology', () => {
    render(
      <Card role="region" aria-label="Billing card">
        <CardContent>Billing</CardContent>
      </Card>
    )

    expect(screen.getByRole('region', { name: /billing card/i })).toBeInTheDocument()
  })
})
