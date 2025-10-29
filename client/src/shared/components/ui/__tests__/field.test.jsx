import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Input } from '../input'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle
} from '../field'

describe('Field', () => {
  const setup = () =>
    render(
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <FieldContent>
              <Input id="name" aria-label="Name" placeholder="Enter name" />
              <FieldDescription>Used for your account.</FieldDescription>
            </FieldContent>
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field data-invalid="true">
            <FieldTitle>Role</FieldTitle>
            <FieldError errors={[{ message: 'Role is required' }]} />
          </Field>
        </FieldGroup>
      </FieldSet>
    )

  it('renders field elements with default props', () => {
    setup()
    expect(screen.getByText(/profile/i)).toBeInTheDocument()
    expect(screen.getByText(/used for your account/i)).toBeInTheDocument()
  })

  it('accepts custom class names on the field set', () => {
    render(<FieldSet className="custom-field">Content</FieldSet>)
    expect(screen.getByText(/content/i).closest('fieldset')).toHaveClass('custom-field')
  })

  it('handles user interaction within fields', () => {
    setup()
    const input = screen.getByRole('textbox', { name: /name/i })
    fireEvent.change(input, { target: { value: 'Jane' } })
    expect(input).toHaveValue('Jane')
  })

  it('provides accessible labelling and error messaging', () => {
    setup()
    const input = screen.getByRole('textbox', { name: /name/i })
    expect(input).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/role is required/i)
  })
})
