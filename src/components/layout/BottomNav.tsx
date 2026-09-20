import { ClipboardList, FileText, Home, PlusCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export default function BottomNav() {
  const { pathname } = useLocation()
  return <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-white safe-bottom"><div className="container flex h-16 items-center justify-around"><NavItem to="/dashboard" icon={Home} label="Home" active={pathname === '/dashboard'} /><NavItem to="/inspections/new" icon={PlusCircle} label="New inspection" active={pathname === '/inspections/new'} /><NavItem to="/inspections/join" icon={ClipboardList} label="Join" active={pathname === '/inspections/join'} /><NavItem to="/reports" icon={FileText} label="Reports" active={pathname === '/reports'} /></div></nav>
}

function NavItem({ to, icon: Icon, label, active = false }: { to: string; icon: LucideIcon; label: string; active?: boolean }) {
  return <Link to={to} className={`flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium no-underline ${active ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`} aria-current={active ? 'page' : undefined}><Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} /><span>{label}</span></Link>
}
