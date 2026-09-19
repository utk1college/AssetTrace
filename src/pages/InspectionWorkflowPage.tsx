import { useEffect } from 'react'
import {
  ArrowRight,
  Bike,
  Building2,
  House,
  RotateCcw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import Checklist from '@/components/inspection/Checklist'
import InspectionProgress from '@/components/inspection/InspectionProgress'
import LoadingState from '@/components/feedback/LoadingState'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { useInspectionStore } from '@/store/inspectionStore'
import type { AssetType, Inspection } from '@/services/inspectionService'

const ASSET_ICONS: Record<AssetType, LucideIcon> = {
  scooter: Bike,
  bike: Bike,
  apartment: Building2,
  house: House,
}

const ASSET_LABELS: Record<AssetType, string> = {
  scooter: 'Scooter',
  bike: 'Bike',
  apartment: 'Apartment',
  house: 'House',
}

export default function InspectionWorkflowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const inspection = useInspectionStore(
    (state) => state.currentInspection,
  )
  const isLoading = useInspectionStore(
    (state) => state.isLoading,
  )
  const error = useInspectionStore((state) => state.error)
  const getInspection = useInspectionStore(
    (state) => state.getInspection,
  )
  const clearError = useInspectionStore(
    (state) => state.clearError,
  )

  useEffect(() => {
    if (!id) return

    clearError()
    void getInspection(id).catch(() => {
      // The store exposes the recoverable error state.
    })
  }, [id, getInspection, clearError])

  if (isLoading && !inspection) {
    return <LoadingState label="Loading inspection" />
  }

  if (!id) {
    return (
      <WorkflowError
        message="This inspection link is missing an inspection ID."
        onRetry={() => navigate('/dashboard')}
        retryLabel="Back to dashboard"
      />
    )
  }

  if (error && !inspection) {
    return (
      <WorkflowError
        message={error}
        onRetry={() => {
          clearError()
          void getInspection(id).catch(() => {
            // The store exposes the recoverable error state.
          })
        }}
        retryLabel="Try again"
      />
    )
  }

  if (!inspection) {
    return (
      <WorkflowError
        message="We couldn't find this inspection."
        onRetry={() => navigate('/dashboard')}
        retryLabel="Back to dashboard"
      />
    )
  }

  const Icon = ASSET_ICONS[inspection.assetType]

  const completedAreas = inspection.completedAreaIds.length
  const totalAreas = inspection.areas.length

  const nextAction = getNextAction(inspection)

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24">
      <div className="container py-6">
        <header className="mb-8">
          <p className="text-small mb-1">
            {formatInspectionType(inspection.inspectionType)}
          </p>
          <h1 className="text-display">{inspection.assetName}</h1>
        </header>

        <main className="space-y-8">
          <section className="card p-5">
            <div className="flex items-start gap-3">
              <span className="asset-icon">
                <Icon aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-subheading">
                  {ASSET_LABELS[inspection.assetType]}
                </p>

                <p className="text-small mt-1">
                  Session {inspection.sessionCode}
                </p>
              </div>

              <span className={getStatusBadgeClass(inspection.status)}>
                {getStatusLabel(inspection.status)}
              </span>
            </div>
          </section>

          <section aria-labelledby="progress-heading">
            <div className="mb-3">
              <h2
                id="progress-heading"
                className="section-label"
              >
                INSPECTION PROGRESS
              </h2>
            </div>

            <InspectionProgress
              completedAreas={completedAreas}
              totalAreas={totalAreas}
            />
          </section>

          <section aria-labelledby="checklist-heading">
            <div className="mb-3">
              <h2
                id="checklist-heading"
                className="section-label"
              >
                AREAS TO RECORD
              </h2>
            </div>

            {totalAreas === 0 ? (
              <div className="card p-5">
                <p className="text-subheading font-semibold">
                  No inspection areas available
                </p>
                <p className="text-small mt-2">
                  This inspection does not currently contain any areas to
                  record.
                </p>
              </div>
            ) : (
              <Checklist
                areas={inspection.areas}
                completedAreaIds={inspection.completedAreaIds}
              />
            )}
          </section>

          {error && inspection && (
            <div
              className="card p-4"
              role="alert"
            >
              <p className="text-small text-[var(--error)]">
                {error}
              </p>
            </div>
          )}

          <section>
            <PrimaryButton
              fullWidth
              type="button"
              onClick={() => navigate(nextAction.path)}
            >
              {nextAction.label}
              <ArrowRight
                className="h-5 w-5"
                aria-hidden="true"
              />
            </PrimaryButton>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="mt-3 min-h-12 w-full rounded-lg px-4 text-small font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
            >
              Back to dashboard
            </button>
          </section>
        </main>
      </div>
    </div>
  )
}

function getNextAction(
  inspection: Inspection,
): {
  label: string
  path: string
} {
  switch (inspection.status) {
    case 'awaiting-confirmation':
      return {
        label: 'Review inspection',
        path: `/inspections/${inspection.id}/review`,
      }

    case 'locked':
      return {
        label: 'Start return inspection',
        path: `/inspections/${inspection.id}/return`,
      }

    case 'in-progress':
    default:
      return {
        label: 'Continue inspection',
        path: `/inspections/${inspection.id}/capture`,
      }
  }
}

function formatInspectionType(
  type: Inspection['inspectionType'],
): string {
  switch (type) {
    case 'move-in':
      return 'Move-in inspection'

    case 'move-out':
      return 'Move-out inspection'

    case 'handover':
      return 'Handover inspection'
  }
}

function getStatusLabel(
  status: Inspection['status'],
): string {
  switch (status) {
    case 'in-progress':
      return 'In progress'

    case 'awaiting-confirmation':
      return 'Ready to confirm'

    case 'locked':
      return 'Locked'
  }
}

function getStatusBadgeClass(
  status: Inspection['status'],
): string {
  switch (status) {
    case 'in-progress':
      return 'badge badge-warning'

    case 'awaiting-confirmation':
      return 'badge badge-warning'

    case 'locked':
      return 'badge badge-success'
  }
}

function WorkflowError({
  message,
  onRetry,
  retryLabel,
}: {
  message: string
  onRetry: () => void
  retryLabel: string
}) {
  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24">
      <div className="container py-6">
        <section
          className="card p-5"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="asset-icon">
              <RotateCcw aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="text-subheading font-semibold">
                We couldn't open this inspection
              </h1>

              <p className="text-small mt-2">
                {message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetry}
            className="mt-5 min-h-12 rounded-lg border border-[var(--border)] px-4 text-small font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
          >
            {retryLabel}
          </button>
        </section>
      </div>
    </div>
  )
}