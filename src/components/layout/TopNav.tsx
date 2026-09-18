import { Link } from 'react-router-dom'
import { UserRound } from 'lucide-react'

export default function TopNav() {
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
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)]" aria-label="Signed in user"><UserRound className="h-5 w-5" /></span>
        </div>
      </div>
    </header>
  )
}
