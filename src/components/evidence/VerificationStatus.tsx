import { cn } from '@/utils/cn'

interface VerificationStatusProps {
  className?: string
}

export default function VerificationStatus({ className }: VerificationStatusProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">VerificationStatus Component</p>
    </div>
  )
}
