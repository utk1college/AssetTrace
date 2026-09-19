import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import LoadingState from '@/components/feedback/LoadingState'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, isHydrating } = useAuthStore()

  if (isHydrating) return <LoadingState label="Checking your session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
