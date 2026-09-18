import { cn } from '@/utils/cn'

interface ErrorStateProps {
  className?: string
}

export default function ErrorState({ className }: ErrorStateProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">ErrorState Component</p>
    </div>
  )
}
