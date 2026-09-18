import { AuthError } from '@/types/auth'
import type { AuthService, Role, User } from '@/types/auth'

interface MockAccount extends User {
  password: string
}

const ACCOUNTS_KEY = 'assettrace.mock.accounts'
const CURRENT_USER_KEY = 'assettrace.mock.user'
const TOKEN_KEY = 'assettrace.mock.token'

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), 300))
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function readAccounts(): MockAccount[] {
  const stored = window.localStorage.getItem(ACCOUNTS_KEY)
  if (!stored) return []

  try {
    const accounts = JSON.parse(stored) as MockAccount[]
    return Array.isArray(accounts) ? accounts : []
  } catch {
    return []
  }
}

function writeAccounts(accounts: MockAccount[]): void {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function withoutPassword(account: MockAccount): User {
  const { password: _password, ...user } = account
  return user
}

function validateCredentials(email: string, password: string): void {
  if (!email.trim()) throw new AuthError('Enter your email address.')
  if (!email.includes('@')) throw new AuthError('Enter a valid email address.')
  if (!password) throw new AuthError('Enter your password.')
}

function validateRegistration(name: string, email: string, password: string, role: Role): void {
  if (!name.trim()) throw new AuthError('Enter your name.')
  validateCredentials(email, password)
  if (password.length < 8) throw new AuthError('Password must be at least 8 characters.')
  if (role !== 'owner' && role !== 'renter') throw new AuthError('Choose an account type.')
}

const mockAuthService: AuthService = {
  async signUp(name, email, password, role) {
    validateRegistration(name, email, password, role)
    const normalizedEmail = normalizeEmail(email)
    const accounts = readAccounts()

    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new AuthError('An account with this email already exists.')
    }

    const account: MockAccount = {
      id: `mock-user-${crypto.randomUUID()}`,
      name: name.trim(),
      email: normalizedEmail,
      role,
      password,
    }
    writeAccounts([...accounts, account])
    return delay(withoutPassword(account))
  },

  async signIn(email, password) {
    validateCredentials(email, password)
    const account = readAccounts().find((candidate) => candidate.email === normalizeEmail(email))

    if (!account || account.password !== password) {
      throw new AuthError('Email or password is incorrect.')
    }

    const user = withoutPassword(account)
    const token = `mock-token-${crypto.randomUUID()}`
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    window.localStorage.setItem(TOKEN_KEY, token)
    return delay({ user, token })
  },

  async signOut() {
    window.localStorage.removeItem(CURRENT_USER_KEY)
    window.localStorage.removeItem(TOKEN_KEY)
    await delay(undefined)
  },

  async getCurrentUser() {
    const stored = window.localStorage.getItem(CURRENT_USER_KEY)
    if (!stored) return delay(null)

    try {
      return delay(JSON.parse(stored) as User)
    } catch {
      window.localStorage.removeItem(CURRENT_USER_KEY)
      window.localStorage.removeItem(TOKEN_KEY)
      return delay(null)
    }
  },

  getToken() {
    return window.localStorage.getItem(TOKEN_KEY)
  },
}

export default mockAuthService
