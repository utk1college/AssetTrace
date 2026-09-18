import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import LoadingState from '@/components/feedback/LoadingState'
import { useAuthStore } from '@/store/authStore'

export default function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, isHydrating } = useAuthStore()
  if (isHydrating) return <LoadingState label="Checking your session" />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}
