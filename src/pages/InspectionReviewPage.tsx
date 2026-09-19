import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, RefreshCw } from 'lucide-react'
import LoadingState from '@/components/feedback/LoadingState'
import EvidenceCard from '@/components/evidence/EvidenceCard'
import VerificationStatus from '@/components/evidence/VerificationStatus'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'
import { useInspectionStore } from '@/store/inspectionStore'

export default function InspectionReviewPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const inspection = useInspectionStore((state) => state.currentInspection)
  const isLoading = useInspectionStore((state) => state.isLoading)
  const error = useInspectionStore((state) => state.error)
  const getInspection = useInspectionStore((state) => state.getInspection)
  const clearError = useInspectionStore((state) => state.clearError)
  useEffect(() => { if (!id || inspection?.id === id) return; void getInspection(id).catch(() => undefined) }, [getInspection, id, inspection?.id])
  if (isLoading && inspection?.id !== id) return <LoadingState label="Loading inspection evidence" />
  if (error && inspection?.id !== id) return <main className="container py-8"><div className="card p-5"><h1 className="text-display">We couldn’t load this inspection</h1><p className="text-body mt-2">{error}</p><SecondaryButton className="mt-5" onClick={() => { clearError(); void getInspection(id).catch(() => undefined) }}><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</SecondaryButton></div></main>
  if (!inspection) return null
  const capturedCount = inspection.completedAreaIds.length
  const areaCount = inspection.areas.length
  const progress = areaCount ? Math.round((capturedCount / areaCount) * 100) : 0
  return <main className="container space-y-8 py-6"><header><p className="section-label">EVIDENCE REVIEW</p><h1 className="text-display mt-1">Review {inspection.assetName}</h1><p className="text-body mt-2">Check each captured area before both parties confirm the baseline.</p></header><section className="card space-y-4 p-4"><div className="flex items-baseline justify-between gap-3"><h2 className="text-subheading">Captured-area progress</h2><span className="text-small">{capturedCount} of {areaCount} areas · {progress}%</span></div><div className="progress-container" aria-label={`${progress}% of areas captured`}><div className={`progress-bar ${progress < 100 ? 'progress-bar-warning' : ''}`} style={{ width: `${progress}%` }} /></div><p className="text-small">{capturedCount === areaCount ? 'All areas have capture records.' : 'Complete the remaining areas before confirming.'}</p></section><section><div className="mb-2 flex items-center justify-between"><h2 className="text-subheading">Area checklist</h2><span className="text-small">Evidence count: {capturedCount}</span></div><div className="card px-4">{inspection.areas.map((area) => <EvidenceCard key={area} area={area} captured={inspection.completedAreaIds.includes(area)} />)}</div></section><section><h2 className="text-subheading mb-2">Verification status</h2><VerificationStatus hasWarnings={false} /></section><div className="space-y-3"><PrimaryButton fullWidth onClick={() => navigate(`/inspections/${id}/verify`)} disabled={capturedCount < areaCount}><ArrowRight className="h-5 w-5" aria-hidden="true" />Continue to confirmation</PrimaryButton>{capturedCount < areaCount && <p className="text-small text-center">Finish capturing all areas to continue.</p>}<Link className="btn btn-secondary w-full" to={`/inspections/${id}`}>Back to inspection</Link></div></main>
}
