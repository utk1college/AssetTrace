import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, backTo, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-start sm:items-center gap-4">
        {backTo && (
          <Link
            to={backTo}
            className="p-2 -ml-2 rounded-full hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <div>
          <h1 className="text-page-heading text-[var(--text-primary)]">{title}</h1>
          {subtitle && (
            <p className="text-secondary text-[var(--text-muted)] mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
