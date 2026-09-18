import { cn } from '@/utils/cn'

interface ReportSectionProps {
  className?: string
}

export default function ReportSection({ className }: ReportSectionProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">ReportSection Component</p>
    </div>
  )
}
