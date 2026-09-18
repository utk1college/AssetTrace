import { cn } from '@/utils/cn'

interface InspectionProgressProps {
  className?: string
}

export default function InspectionProgress({ className }: InspectionProgressProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">InspectionProgress Component</p>
    </div>
  )
}
