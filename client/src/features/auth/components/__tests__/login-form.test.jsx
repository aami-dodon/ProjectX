import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()
const mockApiPost = vi.fn()
let dispatchEventSpy

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

const { LoginForm } = await import('../login-form')

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    dispatchEventSpy?.mockRestore()
  })

  const renderLoginForm = () =>
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    )

  it('submits credentials, stores tokens, and navigates on success', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      status: 'ACTIVE',
      emailVerifiedAt: '2024-01-01T00:00:00.000Z',
      lastLoginAt: '2024-01-02T00:00:00.000Z',
      mfaEnabled: false,
      roles: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    mockApiPost.mockResolvedValue({
      data: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        refreshExpiresAt: '2099-01-01T00:00:00.000Z',
        user: mockUser,
      },
    })

    const { container } = renderLoginForm()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: ' Test@Example.COM ' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret-password' },
    })

    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form)

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledTimes(1))

    expect(mockApiPost).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'secret-password',
    })
    expect(window.localStorage.getItem('accessToken')).toBe('access-token')
    expect(window.localStorage.getItem('refreshToken')).toBe('refresh-token')
    expect(JSON.parse(window.localStorage.getItem('user') ?? '{}')).toEqual(
      mockUser,
    )
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'px:user-updated' }),
    )
    expect(mockToastSuccess).toHaveBeenCalledWith('Welcome back!', {
      description: 'You have successfully signed in.',
    })
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('surfaces API errors and keeps credentials for retry', async () => {
    mockApiPost.mockRejectedValue({ message: 'Invalid login attempt' })

    const { container } = renderLoginForm()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password-123' },
    })

    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form)

    await waitFor(() =>
      expect(screen.getByText('Invalid login attempt')).toBeInTheDocument()
    )

    expect(mockApiPost).toHaveBeenCalledWith('/api/auth/login', {
      email: 'user@example.com',
      password: 'password-123',
    })
    expect(mockToastError).toHaveBeenCalledWith('Login failed', {
      description: 'Invalid login attempt',
    })
    expect(window.localStorage.getItem('accessToken')).toBeNull()
    expect(window.localStorage.getItem('refreshToken')).toBeNull()
    expect(window.localStorage.getItem('user')).toBeNull()
    expect(dispatchEventSpy).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('requires both email and password before submitting', async () => {
    const { container } = renderLoginForm()

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: '   ' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'present-password' },
    })

    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form)

    await waitFor(() =>
      expect(
        screen.getByText('Both email and password are required')
      ).toBeInTheDocument()
    )
    expect(mockApiPost).not.toHaveBeenCalled()
    expect(mockToastError).not.toHaveBeenCalled()
  })
})
