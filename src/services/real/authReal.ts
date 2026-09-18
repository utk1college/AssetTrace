import { AuthError } from '@/types/auth'
import type { AuthService, Role, User } from '@/types/auth'

interface ApiErrorResponse {
  error?: { code?: string; message?: string }
}

interface LoginResponse {
  user: User
  token?: string
  accessToken?: string
  idToken?: string
}

const endpoint = import.meta.env.VITE_API_ENDPOINT?.trim()

function requireEndpoint(): string {
  if (!endpoint) throw new AuthError('Authentication service is not configured yet.')
  return endpoint.replace(/\/$/, '')
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${requireEndpoint()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new AuthError(body?.error?.message ?? 'Authentication request failed. Try again.')
  }

  return response.json() as Promise<T>
}

const realAuthService: AuthService = {
  async signUp(name, email, password, role: Role) {
    return request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    })
  },

  async signIn(email, password) {
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const token = response.token ?? response.accessToken ?? response.idToken
    if (!token) throw new AuthError('Login succeeded but no access token was returned.')
    return { user: response.user, token }
  },

  async signOut() {
    await Promise.resolve()
  },

  async getCurrentUser() {
    await Promise.resolve()
    return null
  },

  getToken() {
    return null
  },
}

export default realAuthService
