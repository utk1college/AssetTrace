import { create } from 'zustand'
import authService from '@/services/authService'
import type { SignUpResult, User } from '@/types/auth'

interface AuthState {
  user: User | null
  isHydrating: boolean
  isLoading: boolean
  error: string | null
  hydrate: () => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>
  confirmSignUp: (email: string, confirmationCode: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.'
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isHydrating: true,
  isLoading: false,
  error: null,

  async hydrate() {
    set({ isHydrating: true, error: null })
    try {
      const user = await authService.getCurrentUser()
      set({ user, isHydrating: false })
    } catch (error) {
      set({ user: null, isHydrating: false, error: getErrorMessage(error) })
    }
  },

  async signUp(name, email, password) {
    set({ isLoading: true, error: null })
    try {
      const result = await authService.signUp(name, email, password)
      set({ isLoading: false })
      return result
    } catch (error) {
      const message = getErrorMessage(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  async confirmSignUp(email, confirmationCode) {
    set({ isLoading: true, error: null })
    try {
      await authService.confirmSignUp(email, confirmationCode)
      set({ isLoading: false })
    } catch (error) {
      const message = getErrorMessage(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  async signIn(email, password) {
    set({ isLoading: true, error: null })
    try {
      const { user } = await authService.signIn(email, password)
      set({ user, isLoading: false })
    } catch (error) {
      const message = getErrorMessage(error)
      set({ isLoading: false, error: message })
      throw new Error(message)
    }
  },

  async signOut() {
    set({ isLoading: true, error: null })
    try {
      await authService.signOut()
      set({ user: null, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: getErrorMessage(error) })
    }
  },

  clearError() {
    set({ error: null })
  },
}))
