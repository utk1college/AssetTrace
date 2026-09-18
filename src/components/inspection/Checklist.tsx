import { cn } from '@/utils/cn'

interface ChecklistProps {
  className?: string
}

export default function Checklist({ className }: ChecklistProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">Checklist Component</p>
    </div>
  )
}
