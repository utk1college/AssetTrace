import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, LockKeyhole, RefreshCw } from 'lucide-react'
import LoadingState from '@/components/feedback/LoadingState'
import PartyStatus from '@/components/verification/PartyStatus'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'
import { useAuthStore } from '@/store/authStore'
import { useInspectionStore } from '@/store/inspectionStore'

export default function JointVerificationPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const inspection = useInspectionStore((state) => state.currentInspection)
  const isLoading = useInspectionStore((state) => state.isLoading)
  const error = useInspectionStore((state) => state.error)
  const getInspection = useInspectionStore((state) => state.getInspection)
  const acknowledgeInspection = useInspectionStore((state) => state.acknowledgeInspection)
  const lockInspection = useInspectionStore((state) => state.lockInspection)
  const clearError = useInspectionStore((state) => state.clearError)
  useEffect(() => { if (!id || inspection?.id === id) return; void getInspection(id).catch(() => undefined) }, [getInspection, id, inspection?.id])
  const state = useMemo(() => { if (!inspection) return { ownerAcknowledged: false, renterAcknowledged: false, bothAcknowledged: false }; const ownerAcknowledged = Boolean(inspection.ownerId && inspection.acknowledgements?.[inspection.ownerId]); const renterAcknowledged = Boolean(inspection.renterId && inspection.acknowledgements?.[inspection.renterId]); return { ownerAcknowledged, renterAcknowledged, bothAcknowledged: ownerAcknowledged && renterAcknowledged } }, [inspection])
  if (isLoading && inspection?.id !== id) return <LoadingState label="Loading confirmation status" />
  if (error && inspection?.id !== id) return <main className="container py-8"><div className="card p-5"><h1 className="text-display">We couldn’t load confirmation status</h1><p className="text-body mt-2">{error}</p><SecondaryButton className="mt-5" onClick={() => { clearError(); void getInspection(id).catch(() => undefined) }}><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</SecondaryButton></div></main>
  if (!inspection || !user) return null
  const currentInspection = inspection
  const currentUser = user
  const currentAcknowledged = Boolean(currentInspection.acknowledgements?.[currentUser.id])
  const otherAcknowledged = currentUser.id === currentInspection.ownerId ? state.renterAcknowledged : state.ownerAcknowledged
  const otherTimestamp = currentUser.id === currentInspection.ownerId ? currentInspection.acknowledgements?.[currentInspection.renterId ?? ''] : currentInspection.ownerId ? currentInspection.acknowledgements?.[currentInspection.ownerId] : undefined
  async function acknowledge() { await acknowledgeInspection(currentInspection.id, currentUser.id) }
  async function lock() { const locked = await lockInspection(currentInspection.id); if (locked.status === 'locked' && locked.lockedAt) navigate(`/inspections/${currentInspection.id}/locked`) }
  return <main className="container space-y-8 py-6"><header><p className="section-label">JOINT VERIFICATION</p><h1 className="text-display mt-1">Confirm the baseline</h1><p className="text-body mt-2">Each participant confirms their own review. The baseline becomes read-only after locking.</p></header>{error && <div className="rounded-[var(--radius-md)] border border-[var(--error)] bg-[var(--error-light)] p-4" role="alert"><p className="text-body text-[var(--error)]">{error}</p></div>}<section className="card p-4"><h2 className="text-subheading mb-2">Confirmation status</h2><PartyStatus label="You" acknowledged={currentAcknowledged} timestamp={inspection.acknowledgements?.[user.id]} /><PartyStatus label="Other party" acknowledged={otherAcknowledged} timestamp={otherTimestamp} /></section><section className="card p-4"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--success)]" aria-hidden="true" /><div><h2 className="text-subheading">Your confirmation</h2><p className="text-body mt-1">Confirm only what you have personally reviewed. This records your acknowledgement with the inspection.</p></div></div><PrimaryButton fullWidth className="mt-5" onClick={() => void acknowledge()} disabled={currentAcknowledged || inspection.status === 'locked' || isLoading}>{currentAcknowledged ? 'You have confirmed' : 'I confirm this inspection'}</PrimaryButton></section><section className="card p-4"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-secondary)]" aria-hidden="true" /><div><h2 className="text-subheading">Lock baseline</h2><p className="text-body mt-1">{state.bothAcknowledged ? 'Both parties have confirmed. You can now lock the baseline.' : 'Both parties must confirm before the baseline can be locked.'}</p></div></div><PrimaryButton fullWidth className="mt-5" onClick={() => void lock()} disabled={!state.bothAcknowledged || inspection.status === 'locked' || isLoading}><LockKeyhole className="h-5 w-5" aria-hidden="true" />{inspection.status === 'locked' ? 'Baseline locked' : 'Lock baseline'}</PrimaryButton></section><Link className="btn btn-secondary w-full" to={`/inspections/${id}/review`}>Back to evidence review</Link></main>
}
