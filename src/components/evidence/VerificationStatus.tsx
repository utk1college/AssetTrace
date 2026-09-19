import { cn } from '@/utils/cn'
import { CircleAlert, ShieldCheck } from 'lucide-react'

interface VerificationStatusProps {
  className?: string
  hasWarnings: boolean
}

export default function VerificationStatus({ className, hasWarnings }: VerificationStatusProps) {
  return (
    <div className={cn('flex items-start gap-3 rounded-[var(--radius-md)] border p-4', hasWarnings ? 'border-[var(--warning)] bg-[var(--warning-light)]' : 'border-[var(--border)] bg-[var(--background)]', className)}>
      {hasWarnings ? <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" aria-hidden="true" /> : <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" aria-hidden="true" />}
      <div><p className="text-body font-medium">{hasWarnings ? 'Possible capture issue' : 'No verification warnings'}</p><p className="text-small">{hasWarnings ? 'Review the affected areas before confirming.' : 'Warnings will appear here when evidence verification is available.'}</p></div>
    </div>
  )
}
