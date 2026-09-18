import { cn } from '@/utils/cn'

interface EvidenceCardProps {
  className?: string
}

export default function EvidenceCard({ className }: EvidenceCardProps) {
  return (
    <div className={cn('p-4 border border-[var(--border)] rounded-md', className)}>
      <p className="text-secondary text-[var(--text-muted)]">EvidenceCard Component</p>
    </div>
  )
}
