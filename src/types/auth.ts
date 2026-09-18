export type Role = 'owner' | 'renter'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface AuthService {
  signUp(name: string, email: string, password: string, role: Role): Promise<User>
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
