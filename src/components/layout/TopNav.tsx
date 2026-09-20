import { Link, useLocation } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function TopNav() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-subheading text-[var(--text-primary)] group-active:text-[var(--accent)] transition-colors">
              AssetTrace
            </span>
          </Link>
          
          {/* Right side nav */}
          {user && <Link to="/profile" className={`flex min-h-12 items-center gap-2 rounded-lg px-2 no-underline ${location.pathname === '/profile' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} hover:bg-[var(--surface-subtle)]`} aria-label="Open profile">
            <UserRound className="h-5 w-5" aria-hidden="true" />
            <span className="hidden text-small sm:inline">Account</span>
          </Link>}
        </div>
      </div>
    </header>
  )
}
