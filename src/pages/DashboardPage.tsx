import { useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bike,
  Building2,
  ChevronRight,
  House,
  Plus,
  Square,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import PrimaryButton from '@/components/ui/PrimaryButton'
import EmptyState from '@/components/feedback/EmptyState'
import LoadingState from '@/components/feedback/LoadingState'
import { useAuthStore } from '@/store/authStore'
import { useInspectionStore } from '@/store/inspectionStore'
import type {
  AssetType,
  Inspection,
} from '@/services/inspectionService'

const ASSET_ICONS: Record<AssetType, LucideIcon> = {
  scooter: Bike,
  bike: Bike,
  apartment: Building2,
  house: House,
  wall: Square,
}
const ASSET_LABELS: Record<AssetType, string> = {
  scooter: 'Scooter',
  bike: 'Bike',
  apartment: 'Apartment',
  house: 'House',
  wall: 'Wall',
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  const inspections = useInspectionStore(
    (state) => state.inspections,
  )
  const currentInspection = useInspectionStore(
    (state) => state.currentInspection,
  )
  const isLoading = useInspectionStore(
    (state) => state.isLoading,
  )
  const error = useInspectionStore((state) => state.error)
  const listInspections = useInspectionStore(
    (state) => state.listInspections,
  )

const loadInspections = useCallback(async () => {
  if (!user) return

  try {
    await listInspections(user.id)
  } catch {
    // The store exposes the error state for the UI.
  }
}, [user, listInspections])

useEffect(() => {
  void loadInspections()
}, [loadInspections])

  const visibleInspections = [...inspections]
  if (
    currentInspection &&
    !visibleInspections.some(
      (inspection) => inspection.id === currentInspection.id,
    )
  ) {
    visibleInspections.unshift(currentInspection)
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24">
      <div className="container py-6">
        <header className="mb-7">
          <p className="text-small mb-1">Evidence-led handovers</p>
          <h1 className="text-display">Your inspections</h1>
          <p className="text-body mt-2">Secure the starting condition, compare the return, and keep one clear record.</p>
        </header>

        <Link
          to="/inspections/new"
          className="block mb-8"
        >
          <PrimaryButton fullWidth>
            <Plus className="h-5 w-5" aria-hidden="true" />
            Start an inspection
          </PrimaryButton>
        </Link>

        <section
          aria-labelledby="active-inspections"
          className="mb-8"
        >
          <h2
            id="active-inspections"
            className="section-label mb-3"
          >
            ACTIVE INSPECTIONS
          </h2>

          {isLoading ? (
            <LoadingState label="Loading inspections" />
          ) : error ? (
            <div
              className="card p-5"
              role="alert"
            >
              <p className="text-subheading font-semibold text-[var(--text-primary)]">
                We couldn't load your inspections
              </p>

              <p className="text-small mt-2">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void loadInspections()}
                className="mt-4 min-h-12 rounded-lg border border-[var(--border)] px-4 text-small font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
              >
                Try again
              </button>
            </div>
          ) : visibleInspections.length === 0 ? (
            <EmptyState
              title="No active inspections"
              description="Start an inspection to record an asset's condition."
              actionLabel="Start an inspection"
              actionLink="/inspections/new"
            />
          ) : (
            <div className="space-y-3">
              {visibleInspections.map((inspection) => (
                <InspectionCard
                  key={inspection.id}
                  inspection={inspection}
                  userId={user?.id}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

function InspectionCard({
  inspection,
  userId,
}: {
  inspection: Inspection
    userId?: string
}) {
  const Icon = ASSET_ICONS[inspection.assetType]

  const totalAreas = inspection.capturePoints.length || inspection.areas.length
  const completedAreas = inspection.completedAreaIds.length

  const percent =
    totalAreas > 0
      ? Math.min(
          100,
          Math.round((completedAreas / totalAreas) * 100),
        )
      : 0

  const status = getStatusDisplay(inspection.status)

      const participant = userId === inspection.ownerId
        ? `Owner: You · ${inspection.renterId ? 'Renter joined' : 'Renter pending'}`
        : `Renter: You · ${inspection.ownerId ? 'Owner joined' : 'Owner pending'}`
      const stage = inspection.returnCompletedAt
        ? 'Transaction frozen'
        : inspection.status === 'locked'
          ? 'Baseline secured · Return stage'
          : inspection.status === 'awaiting-confirmation'
            ? 'Awaiting both confirmations'
            : 'Baseline capture stage'

  return (
    <Link
      to={`/inspections/${inspection.id}`}
      className="block card-interactive p-4 no-underline"
    >
      <div className="flex items-center gap-3">
        <span className="asset-icon">
          <Icon aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-subheading truncate">
              {inspection.assetName}
            </p>

            <ChevronRight
              className="h-5 w-5 shrink-0 text-[var(--text-tertiary)]"
              aria-hidden="true"
            />
          </div>

          <p className="text-small truncate">
            {ASSET_LABELS[inspection.assetType]} · {participant}
          </p>
          <p className="text-small mt-1 font-medium text-[var(--text-primary)]">{stage}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="badge badge-neutral">
          {formatInspectionType(inspection.inspectionType)}
        </span>

        <span className={`text-small font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between text-tiny">
          <span>
            {completedAreas} of {totalAreas} areas complete
          </span>

          <span>{percent}%</span>
        </div>

        <div className="progress-container">
          <div
            className={`progress-bar ${percent < 100 ? 'progress-bar-warning' : ''}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Link>
  )
}

function getStatusDisplay(
  status: Inspection['status'],
): {
  label: string
  className: string
} {
  switch (status) {
    case 'in-progress':
      return {
        label: 'In progress',
        className: 'status-warning',
      }

    case 'awaiting-confirmation':
      return {
        label: 'Ready to confirm',
        className: 'status-warning',
      }

    case 'locked':
      return {
        label: 'Locked',
        className: 'status-success',
      }
  }
}

function formatInspectionType(
  type: Inspection['inspectionType'],
): string {
  switch (type) {
    case 'move-in':
      return 'Move-in'
    case 'move-out':
      return 'Move-out'
    case 'handover':
      return 'Handover'
  }
}
