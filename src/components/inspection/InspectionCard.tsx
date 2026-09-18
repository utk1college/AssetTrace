import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Inspection {
  id: string
  assetType: string
  assetName: string
  otherParty: string
  inspectionType: 'move-in' | 'move-out'
  status: 'in-progress' | 'awaiting-confirmation' | 'locked'
  createdAt: string
  completedAreas?: number
  totalAreas?: number
}

interface InspectionCardProps {
  inspection: Inspection
}

export default function InspectionCard({ inspection }: InspectionCardProps) {
  const statusLabel = getStatusLabel(inspection.status)
  
  return (
    <Link
      to={`/inspections/${inspection.id}`}
      className="block border border-[var(--border)] rounded-xl p-4 hover:bg-[var(--surface-subtle)] transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="font-semibold text-[var(--text-primary)]">{inspection.assetType}</p>
            <span className="text-[var(--text-muted)]">·</span>
            <p className="text-secondary">{inspection.otherParty}</p>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-secondary">
            <span className="capitalize">{inspection.inspectionType}</span>
            <span className="text-[var(--text-muted)]">·</span>
            <span>{statusLabel}</span>
          </div>
          {inspection.completedAreas !== undefined && inspection.totalAreas !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-[var(--accent)] transition-all"
                  style={{ width: `${(inspection.completedAreas / inspection.totalAreas) * 100}%` }}
                />
              </div>
              <span className="text-xs text-secondary">
                {inspection.completedAreas} / {inspection.totalAreas}
              </span>
            </div>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0" />
      </div>
    </Link>
  )
}

function getStatusLabel(status: Inspection['status']): string {
  switch (status) {
    case 'in-progress':
      return 'In progress'
    case 'awaiting-confirmation':
      return 'Awaiting confirmation'
    case 'locked':
      return 'Locked'
    default:
      return status
  }
}
