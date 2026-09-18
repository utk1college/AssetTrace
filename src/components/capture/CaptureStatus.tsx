import { cn } from '@/utils/cn'

interface CaptureStatusProps {
  className?: string
}

export default function CaptureStatus({ className }: CaptureStatusProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">CaptureStatus Component</p>
    </div>
  )
}
