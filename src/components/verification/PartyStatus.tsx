import { cn } from '@/utils/cn'

interface PartyStatusProps {
  className?: string
}

export default function PartyStatus({ className }: PartyStatusProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">PartyStatus Component</p>
    </div>
  )
}
