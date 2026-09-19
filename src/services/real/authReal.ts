import { AuthError } from '@/types/auth'
import type { AuthService, Role, SignUpResult, User } from '@/types/auth'

interface ApiErrorResponse {
  error?: { code?: string; message?: string }
}

interface LoginResponse {
  accessToken: string
  idToken: string
  refreshToken?: string
}

interface RegisterResponse {
  userSub?: string
  userConfirmed?: boolean
}

const endpoint = import.meta.env.VITE_API_ENDPOINT?.trim()
const CURRENT_USER_KEY = 'assettrace.real.user'
export const REAL_ACCESS_TOKEN_KEY = 'assettrace.real.access-token'
const REAL_CURRENT_USER_KEY = CURRENT_USER_KEY

export function clearRealSession(): void {
  window.localStorage.removeItem(REAL_CURRENT_USER_KEY)
  window.localStorage.removeItem(REAL_ACCESS_TOKEN_KEY)
}

interface IdTokenClaims {
  sub?: unknown
  email?: unknown
  name?: unknown
  role?: unknown
  ['custom:role']?: unknown
}

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

function decodeIdToken(idToken: string): User {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new AuthError('Login returned an invalid identity token.')

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')),
      (character) => character.charCodeAt(0),
    )
    const payload = new TextDecoder().decode(bytes)
    const claims = JSON.parse(payload) as IdTokenClaims
    const id = typeof claims.sub === 'string' ? claims.sub : ''
    const email = typeof claims.email === 'string' ? claims.email : ''
    const name = typeof claims.name === 'string' ? claims.name : email
    const roleClaim = claims['custom:role'] ?? claims.role
    const role = roleClaim === 'owner' || roleClaim === 'renter' ? roleClaim : null

    if (!id || !email || !name || !role) {
      throw new AuthError('Login returned incomplete user information.')
    }

    return { id, name, email, role }
  } catch (error) {
    if (error instanceof AuthError) throw error
    throw new AuthError('Login returned an invalid identity token.')
  }
}

const realAuthService: AuthService = {
  async signUp(name, email, password, role: Role) {
    const response = await request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    })
    return {
      userSub: response.userSub,
      userConfirmed: response.userConfirmed ?? false,
    } satisfies SignUpResult
  },

  async confirmSignUp(email, confirmationCode) {
    await request<{ confirmed: boolean }>('/auth/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, confirmationCode }),
    })
  },

  async signIn(email, password) {
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (!response.accessToken || !response.idToken) {
      throw new AuthError('Login succeeded but required authentication tokens were not returned.')
    }

    const user = decodeIdToken(response.idToken)
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    // API Gateway's JWT authorizer validates the app-client audience, which is
    // present on the Cognito ID token used for protected API requests.
    window.localStorage.setItem(REAL_ACCESS_TOKEN_KEY, response.idToken)
    return { user, token: response.idToken }
  },

  async signOut() {
    clearRealSession()
  },

  async getCurrentUser() {
    const storedUser = window.localStorage.getItem(CURRENT_USER_KEY)
    const accessToken = window.localStorage.getItem(REAL_ACCESS_TOKEN_KEY)
    if (!storedUser || !accessToken) return null

    try {
      return JSON.parse(storedUser) as User
    } catch {
      clearRealSession()
      return null
    }
  },

  getToken() {
    return window.localStorage.getItem(REAL_ACCESS_TOKEN_KEY)
  },
}

export default realAuthService
