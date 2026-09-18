import { cn } from '@/utils/cn'

interface ComparisonViewProps {
  className?: string
}

export default function ComparisonView({ className }: ComparisonViewProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">ComparisonView Component</p>
    </div>
  )
}
