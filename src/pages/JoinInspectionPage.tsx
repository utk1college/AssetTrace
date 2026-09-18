import { useState } from 'react'
import { ArrowRight, Bike, Building2, House } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import PrimaryButton from '@/components/ui/PrimaryButton'
import { useInspectionStore } from '@/store/inspectionStore'
import { isValidSessionCode } from '@/utils/sessionCode'
import type { Inspection } from '@/services/inspectionService'

const ASSET_ICONS: Record<Inspection['assetType'], typeof Bike> = {
  scooter: Bike,
  bike: Bike,
  apartment: Building2,
  house: House,
}

export default function JoinInspectionPage() {
  const navigate = useNavigate()

  const joinInspection = useInspectionStore(
    (state) => state.joinInspection,
  )
  const isLoading = useInspectionStore((state) => state.isLoading)
  const error = useInspectionStore((state) => state.error)
  const clearError = useInspectionStore((state) => state.clearError)

  const [sessionCode, setSessionCode] = useState('')
  const [joinedInspection, setJoinedInspection] =
    useState<Inspection | null>(null)

  const normalizedCode = sessionCode.trim().toUpperCase()

  const hasInput = normalizedCode.length > 0
  const hasInvalidFormat = hasInput && !isValidSessionCode(normalizedCode)

  const handleCodeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)

    setSessionCode(value)

    if (error) {
      clearError()
    }
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!isValidSessionCode(normalizedCode)) {
      return
    }

    try {
      const inspection = await joinInspection(normalizedCode)
      setJoinedInspection(inspection)
    } catch {
      // The store provides the user-facing error.
    }
  }

  if (joinedInspection) {
    const Icon = ASSET_ICONS[joinedInspection.assetType]

    return (
      <div className="min-h-screen bg-[var(--surface)] pb-24">
        <div className="container py-6">
          <header className="mb-8">
            <p className="text-small mb-1">Inspection found</p>
            <h1 className="text-display">You're ready to join</h1>
          </header>

          <main className="space-y-6">
            <section className="card p-5">
              <div className="flex items-start gap-3">
                <span className="asset-icon">
                  <Icon aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="text-subheading truncate">
                    {joinedInspection.assetName}
                  </h2>

                  <p className="text-small">
                    <span className="capitalize">
                      {joinedInspection.assetType}
                    </span>
                    {' · '}
                    <span>
                      {joinedInspection.inspectionType === 'move-in'
                        ? 'Move-in'
                        : 'Move-out'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="section-label mb-1">SESSION CODE</p>
                <p className="text-small tracking-[0.12em]">
                  {joinedInspection.sessionCode}
                </p>
              </div>
            </section>

            <section className="card p-5">
              <p className="text-subheading">Before you continue</p>
              <p className="text-small mt-2">
                You are joining this inspection as the other party. Review
                the asset details above before continuing.
              </p>
            </section>

            <div className="space-y-3">
              <PrimaryButton
                fullWidth
                type="button"
                onClick={() =>
                  navigate(`/inspections/${joinedInspection.id}`)
                }
              >
                Continue to inspection
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </PrimaryButton>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="min-h-12 w-full rounded-lg px-4 text-small font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]"
              >
                Back to dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24">
      <div className="container py-6">
        <header className="mb-8">
          <p className="text-small mb-1">Join inspection</p>
          <h1 className="text-display">Enter the inspection code</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="card p-5">
            <label
              htmlFor="session-code"
              className="section-label mb-3 block"
            >
              SESSION CODE
            </label>

            <input
              id="session-code"
              type="text"
              value={sessionCode}
              onChange={handleCodeChange}
              placeholder="ABC123"
              inputMode="text"
              autoComplete="off"
              maxLength={6}
              aria-describedby="session-code-help session-code-error"
              aria-invalid={hasInvalidFormat || Boolean(error)}
              className="min-h-14 w-full rounded-lg border border-[var(--border)] bg-white px-4 text-center text-xl font-semibold tracking-[0.22em] text-[var(--text-primary)] uppercase outline-none placeholder:tracking-normal placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10"
            />

            <p
              id="session-code-help"
              className="text-small mt-3"
            >
              Enter the 6-character code shared by the other party.
            </p>

            {hasInvalidFormat && (
              <p
                id="session-code-error"
                role="alert"
                className="text-small mt-3 font-medium text-[var(--error)]"
              >
                The code must contain exactly 6 valid characters.
              </p>
            )}

            {!hasInvalidFormat && error && (
              <p
                id="session-code-error"
                role="alert"
                className="text-small mt-3 font-medium text-[var(--error)]"
              >
                {error}
              </p>
            )}
          </section>

          <PrimaryButton
            fullWidth
            type="submit"
            disabled={
              isLoading ||
              !isValidSessionCode(normalizedCode)
            }
          >
            {isLoading ? 'Joining inspection...' : 'Join inspection'}
          </PrimaryButton>
        </form>
      </div>
    </div>
  )
}