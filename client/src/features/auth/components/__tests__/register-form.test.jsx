import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockApiPost = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: (...args) => mockToastSuccess(...args),
    error: (...args) => mockToastError(...args),
  },
}))

vi.mock('@/shared/lib/client', () => ({
  apiClient: {
    post: (...args) => mockApiPost(...args),
  },
}))

const { RegisterForm } = await import('../register-form')

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderRegisterForm = () =>
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    )

  it('submits registration data and guides the user to login', async () => {
    mockApiPost.mockResolvedValue({ data: { status: 'queued' } })

    renderRegisterForm()

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: '  Test User  ' },
    })
    fireEvent.change(screen.getByLabelText(/tenant or organisation/i), {
      target: { value: '   ' },
    })
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'NewUser@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'super-secure-pass' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'super-secure-pass' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledTimes(1))

    expect(mockApiPost).toHaveBeenCalledWith('/api/auth/register', {
      email: 'newuser@example.com',
      password: 'super-secure-pass',
      fullName: 'Test User',
      tenantId: undefined,
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Account created', {
      description: 'Check your inbox for a verification link before signing in.',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', { replace: true })
  })

  it('prevents submission when passwords do not match', async () => {
    renderRegisterForm()

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'pending@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password-one' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password-two' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    )
    expect(mockApiPost).not.toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()
  })

  it('shows API errors when registration fails', async () => {
    mockApiPost.mockRejectedValue({ message: 'Email already registered' })

    renderRegisterForm()

    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password-long-enough' },
    })
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password-long-enough' },
    })

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    )
    expect(mockToastError).toHaveBeenCalledWith('Registration failed', {
      description: 'Email already registered',
    })
  })
})
