import { cn } from '@/utils/cn'
import { Check, CircleAlert, FileQuestion } from 'lucide-react'

interface EvidenceCardProps {
  className?: string
  area: string
  captured: boolean
}

export default function EvidenceCard({ className, area, captured }: EvidenceCardProps) {
  return (
    <div className={cn('flex items-center gap-3 border-b border-[var(--border)] py-3 last:border-b-0', className)}>
      <span className="asset-icon" aria-hidden="true">{captured ? <Check className="text-[var(--success)]" /> : <FileQuestion className="text-[var(--text-tertiary)]" />}</span>
      <div className="min-w-0 flex-1"><p className="text-body font-medium">{area}</p><p className="text-small">{captured ? 'Evidence recorded' : 'Not captured'}</p></div>
      {!captured && <CircleAlert className="h-5 w-5 text-[var(--warning)]" aria-label="Evidence not captured" />}
    </div>
  )
}
