import { cn } from '@/utils/cn'

interface LoadingStateProps {
  className?: string
}

export default function LoadingState({ className }: LoadingStateProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">LoadingState Component</p>
    </div>
  )
}
