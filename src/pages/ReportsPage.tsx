import { FileText, LockKeyhole } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '@/components/feedback/EmptyState'
import LoadingState from '@/components/feedback/LoadingState'
import { useAuthStore } from '@/store/authStore'
import { useInspectionStore } from '@/store/inspectionStore'
import type { Inspection } from '@/services/inspectionService'

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user)
  const inspections = useInspectionStore((state) => state.inspections)
  const isLoading = useInspectionStore((state) => state.isLoading)
  const error = useInspectionStore((state) => state.error)
  const listInspections = useInspectionStore((state) => state.listInspections)

  useEffect(() => {
    if (user) void listInspections(user.id)
  }, [listInspections, user])

  const lockedInspections = inspections.filter((inspection) => inspection.status === 'locked')

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <div className="container space-y-6 py-6">
        <header>
          <p className="section-label">REPORTS</p>
          <h1 className="text-display mt-1">Condition reports</h1>
          <p className="text-body mt-2">Evidence-backed records for completed handovers and return reviews.</p>
        </header>
        {isLoading ? <LoadingState label="Loading reports" /> : error ? <div className="card p-5" role="alert"><h2 className="text-subheading">Reports are unavailable</h2><p className="text-small mt-2">{error}</p></div> : lockedInspections.length === 0 ? <EmptyState title="No reports yet" description="Reports appear after a baseline is locked. Complete an inspection to create your first record." actionLabel="View inspections" actionLink="/dashboard" /> : <div className="space-y-3">{lockedInspections.map((inspection) => <ReportCard key={inspection.id} inspection={inspection} />)}</div>}
      </div>
    </main>
  )
}

function ReportCard({ inspection }: { inspection: Inspection }) {
  return <Link to={`/inspections/${inspection.id}/report`} className="card-interactive block p-4 no-underline"><div className="flex items-start gap-3"><span className="asset-icon"><FileText className="h-5 w-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h2 className="text-subheading truncate">{inspection.assetName}</h2><LockKeyhole className="h-5 w-5 shrink-0 text-[var(--success)]" aria-label="Baseline locked" /></div><p className="text-small mt-1">{formatType(inspection.inspectionType)} · {inspection.returnCompletedAt ? 'Return complete' : 'Return pending'}</p><p className="text-small mt-2">{inspection.returnCompletedAt ? 'Transaction frozen after both handover stages.' : 'Baseline secured; waiting for return evidence.'}</p></div></div></Link>
}

function formatType(type: Inspection['inspectionType']) {
  return type === 'move-in' ? 'Move-in' : type === 'move-out' ? 'Move-out' : 'Handover'
}
