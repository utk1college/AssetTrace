export type Role = 'owner' | 'renter'

export interface User {
  id: string
  name: string
  email: string
}

export interface SignUpResult {
  user?: User
  userSub?: string
  userConfirmed: boolean
}

export interface AuthService {
  signUp(name: string, email: string, password: string): Promise<SignUpResult>
  confirmSignUp(email: string, confirmationCode: string): Promise<void>
  signIn(email: string, password: string): Promise<{ user: User; token: string }>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  getToken(): string | null
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
