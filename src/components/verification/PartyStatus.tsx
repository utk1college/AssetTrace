import { cn } from '@/utils/cn'
import { CheckCircle2, Circle } from 'lucide-react'

interface PartyStatusProps {
  className?: string
  label: string
  acknowledged: boolean
  timestamp?: string
}

export default function PartyStatus({ className, label, acknowledged, timestamp }: PartyStatusProps) {
  return (
    <div className={cn('flex items-start gap-3 border-b border-[var(--border)] py-3 last:border-b-0', className)}>
      {acknowledged ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" aria-hidden="true" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />}
      <div className="min-w-0"><p className="text-body font-medium">{label}: {acknowledged ? 'Confirmed' : 'Waiting'}</p>{acknowledged && timestamp && <p className="text-small">Confirmed {new Date(timestamp).toLocaleString()}</p>}</div>
    </div>
  )
}
