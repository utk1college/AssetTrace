import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LockKeyhole, RefreshCw } from 'lucide-react'
import LoadingState from '@/components/feedback/LoadingState'
import SecondaryButton from '@/components/ui/SecondaryButton'
import { useInspectionStore } from '@/store/inspectionStore'

export default function BaselineLockedPage() {
  const { id = '' } = useParams()
  const inspection = useInspectionStore((state) => state.currentInspection)
  const isLoading = useInspectionStore((state) => state.isLoading)
  const error = useInspectionStore((state) => state.error)
  const getInspection = useInspectionStore((state) => state.getInspection)
  const clearError = useInspectionStore((state) => state.clearError)
  useEffect(() => { if (!id || inspection?.id === id) return; void getInspection(id).catch(() => undefined) }, [getInspection, id, inspection?.id])
  if (isLoading && inspection?.id !== id) return <LoadingState label="Loading locked baseline" />
  if (error && inspection?.id !== id) return <main className="container py-8"><div className="card p-5"><h1 className="text-display">We couldn’t load the locked baseline</h1><p className="text-body mt-2">{error}</p><SecondaryButton className="mt-5" onClick={() => { clearError(); void getInspection(id).catch(() => undefined) }}><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</SecondaryButton></div></main>
  if (!inspection) return null
  return <main className="container space-y-8 py-8"><section className="card p-5 text-center"><span className="asset-icon mx-auto mb-4 h-12 w-12"><LockKeyhole className="h-6 w-6 text-[var(--success)]" aria-hidden="true" /></span><p className="section-label">BASELINE STATUS</p><h1 className="text-display mt-1">Baseline locked</h1><p className="text-body mt-3">The condition record for {inspection.assetName} is now read-only and ready for the return inspection.</p>{inspection.lockedAt && <p className="text-small mt-3">Locked {new Date(inspection.lockedAt).toLocaleString()}</p>}</section><Link className="btn btn-primary w-full" to={`/inspections/${id}/return`}>Continue to return inspection</Link><Link className="btn btn-secondary w-full" to={`/inspections/${id}`}>Back to inspection</Link></main>
}
