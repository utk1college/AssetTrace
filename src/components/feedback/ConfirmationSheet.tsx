import { cn } from '@/utils/cn'

interface ConfirmationSheetProps {
  className?: string
}

export default function ConfirmationSheet({ className }: ConfirmationSheetProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">ConfirmationSheet Component</p>
    </div>
  )
}
