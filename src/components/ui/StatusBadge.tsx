import { cn } from '@/utils/cn'

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'in-progress' | 'locked'

interface StatusBadgeProps {
  variant?: StatusVariant
  children: React.ReactNode
  className?: string
}

export default function StatusBadge({ variant = 'default', children, className }: StatusBadgeProps) {
  const variantStyles: Record<StatusVariant, string> = {
    default: 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]',
    success: 'bg-[#E6F4EA] text-[var(--success)]',
    warning: 'bg-[#FEF3C7] text-[var(--warning)]',
    error: 'bg-[#FCE8E6] text-[var(--error)]',
    'in-progress': 'bg-blue-50 text-blue-700 border border-blue-200',
    locked: 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border)]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
