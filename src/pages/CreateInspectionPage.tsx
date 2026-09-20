import { useState } from 'react'
import { ArrowRight, Bike, Building2, Check, Copy, House, Plus, Square, Trash2, Wrench } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from 'react-router-dom'

import PrimaryButton from '@/components/ui/PrimaryButton'
import { useInspectionStore } from '@/store/inspectionStore'
import type {
  AssetType,
  InspectionType,
  CapturePoint,
  SessionRole,
} from '@/services/inspectionService'
import { INSPECTION_AREAS } from '@/config/constants'
import { useToast } from '@/components/feedback/useToast'

const ASSET_OPTIONS: {
  value: AssetType
  label: string
  description: string
  icon: typeof Bike
}[] = [
  { value: 'scooter', label: 'Scooter', description: 'Capture the ride before handover.', icon: Bike },
  { value: 'bike', label: 'Bike', description: 'Keep every visible detail accountable.', icon: Bike },
  { value: 'apartment', label: 'Apartment', description: 'Record rooms as they change hands.', icon: Building2 },
  { value: 'house', label: 'House', description: 'Build a clear condition record.', icon: House },
  { value: 'wall', label: 'Wall', description: 'Scan one surface for visible change.', icon: Square },
  { value: 'custom', label: 'Custom category', description: 'Name your asset and define every photo title.', icon: Wrench },
]

const INSPECTION_OPTIONS: {
  value: InspectionType
  label: string
  description: string
}[] = [
  {
    value: 'move-in',
    label: 'Initial condition',
    description: 'Record the asset before it changes hands.',
  },
  {
    value: 'move-out',
    label: 'Return condition',
    description: 'Record the asset after use or return.',
  },
]

export default function CreateInspectionPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const createInspection = useInspectionStore(
    (state) => state.createInspection,
  )
  const isLoading = useInspectionStore((state) => state.isLoading)
  const error = useInspectionStore((state) => state.error)

  const [assetType, setAssetType] = useState<AssetType>('scooter')
  const [customAssetType, setCustomAssetType] = useState('')
  const [assetName, setAssetName] = useState('')
  const [inspectionType, setInspectionType] =
    useState<InspectionType>('move-in')
  const [sessionRole, setSessionRole] = useState<SessionRole>('owner')
  const [capturePointTitles, setCapturePointTitles] = useState<string[]>(
    INSPECTION_AREAS.scooter.map((title) => title.replace(/-/g, ' ')),
  )
  const [createdInspection, setCreatedInspection] = useState<Awaited<
    ReturnType<typeof createInspection>
  > | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!assetName.trim()) {
      return
    }

    const titles = capturePointTitles.map((title) => title.trim()).filter(Boolean)
    if (!titles.length) return

    try {
      const inspection = await createInspection({
        assetType,
        customAssetType: assetType === 'custom' ? customAssetType.trim() : undefined,
        assetName,
        inspectionType,
        sessionRole,
        capturePoints: titles.map((title, order): CapturePoint => ({
          id: `capture-${crypto.randomUUID()}`,
          title,
          order,
        })),
      })

      setCreatedInspection(inspection)
    } catch {
      // The store exposes the error for the UI.
    }
  }

  const handleCopyCode = async () => {
    if (!createdInspection) {
      return
    }

    try {
      await navigator.clipboard.writeText(createdInspection.sessionCode)
      setCopied(true)
      showToast('Inspection code copied. Share it with the other party.')

      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setCopied(false)
    }
  }

  if (createdInspection) {
    return (
      <div className="min-h-screen bg-[var(--surface)] pb-24">
        <div className="container py-6">
          <header className="mb-8">
            <p className="text-small mb-1">Inspection created</p>
            <h1 className="text-display">Share this inspection</h1>
          </header>

          <main className="space-y-6">
            <section className="card p-5">
              <div className="flex items-start gap-3">
                <span className="asset-icon">
                  {assetType === 'apartment' ? (
                    <Building2 aria-hidden="true" />
                  ) : assetType === 'house' ? (
                    <House aria-hidden="true" />
                  ) : assetType === 'wall' ? (
                    <Square aria-hidden="true" />
                  ) : assetType === 'custom' ? (
                    <Wrench aria-hidden="true" />
                  ) : (
                    <Bike aria-hidden="true" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="text-subheading truncate">
                    {createdInspection.assetName}
                  </h2>
                  <p className="text-small capitalize">
                    {createdInspection.assetType} ·{' '}
                    {createdInspection.inspectionType}
                  </p>
                </div>
              </div>
            </section>

            <section className="card p-6 text-center">
              <p className="section-label mb-3">SESSION CODE</p>

              <p
                className="text-2xl font-semibold tracking-[0.22em] text-[var(--text-primary)]"
                aria-label={`Session code ${createdInspection.sessionCode}`}
              >
                {createdInspection.sessionCode}
              </p>

              <button
                type="button"
                onClick={handleCopyCode}
                className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-lg border border-[var(--border)] px-4 text-small font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
              >
                {copied ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                {copied ? 'Code copied' : 'Copy code'}
              </button>

              <div className="my-6 flex justify-center">
                <div className="rounded-xl border border-[var(--border)] bg-white p-4">
                  <QRCodeSVG
                    value={createdInspection.sessionCode}
                    size={192}
                    includeMargin
                    aria-label={`QR code for inspection ${createdInspection.sessionCode}`}
                  />
                </div>
              </div>

              <p className="text-small">
                Share the code or QR code with the other party to join this
                inspection.
              </p>
            </section>

            <div className="space-y-3">
              <PrimaryButton
                fullWidth
                type="button"
                onClick={() =>
                  navigate(`/inspections/${createdInspection.id}`)
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
          <p className="text-small mb-1">New inspection</p>
          <h1 className="text-display">Create an inspection</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <h2 className="section-label mb-3">YOUR ROLE IN THIS SESSION</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['owner', 'renter'] as const).map((role) => (
                <button key={role} type="button" aria-pressed={sessionRole === role} onClick={() => setSessionRole(role)} className={`min-h-20 rounded-xl border p-4 text-left ${sessionRole === role ? 'border-[var(--accent)] bg-white ring-1 ring-[var(--accent)]' : 'border-[var(--border)] bg-white'}`}>
                  <p className="text-subheading">{role === 'owner' ? 'Owner' : 'Renter'}</p>
                  <p className="text-small mt-1">{role === 'owner' ? 'I am lending this asset.' : 'I am receiving this asset.'}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-label mb-3">ASSET CATEGORY</h2>

            <div className="grid grid-cols-2 gap-3">
              {ASSET_OPTIONS.map((option) => {
                const Icon = option.icon
                const selected = assetType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setAssetType(option.value)
                      setCapturePointTitles(INSPECTION_AREAS[option.value].map((title) => title.replace(/-/g, ' ')))
                    }}
                    aria-pressed={selected}
                    className={[
                      'min-h-20 rounded-xl border p-4 text-left transition-colors',
                      selected
                        ? 'border-[var(--accent)] bg-white ring-1 ring-[var(--accent)]'
                        : 'border-[var(--border)] bg-white hover:bg-[var(--surface-subtle)]',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-3">
                      <span className="asset-icon">
                        <Icon aria-hidden="true" />
                      </span>

                      <span className="text-subheading">
                        {option.label}
                      </span>
                    </span>
                    <span className="text-small mt-2 block">{option.description}</span>
                  </button>
                )
              })}
            </div>
            {assetType === 'custom' && <div className="mt-4"><label htmlFor="custom-category" className="section-label mb-2 block">YOUR CATEGORY</label><input id="custom-category" value={customAssetType} onChange={(event) => setCustomAssetType(event.target.value)} placeholder="e.g. Office desk" className="input" required /></div>}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-label">PHOTO TITLES</h2>
                <p className="text-small mt-1">These titles become the renter's required return photos.</p>
              </div>
              <button type="button" className="min-h-12 rounded-lg border border-[var(--border)] px-3 text-small" onClick={() => setCapturePointTitles((current) => [...current, ''])}>
                <Plus className="mr-1 inline h-4 w-4" aria-hidden="true" />Add
              </button>
            </div>
            <div className="space-y-3">
              {capturePointTitles.map((title, index) => (
                <div className="flex items-center gap-2" key={`capture-point-${index}`}>
                  <input value={title} onChange={(event) => setCapturePointTitles((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} aria-label={`Photo title ${index + 1}`} className="min-h-12 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-4 text-[15px]" />
                  <button type="button" aria-label={`Remove photo title ${index + 1}`} className="min-h-12 min-w-12 rounded-lg border border-[var(--border)]" onClick={() => setCapturePointTitles((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={capturePointTitles.length === 1}>
                    <Trash2 className="mx-auto h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <label
              htmlFor="asset-name"
              className="section-label mb-3 block"
            >
              ASSET NAME
            </label>

            <input
              id="asset-name"
              type="text"
              value={assetName}
              onChange={(event) => setAssetName(event.target.value)}
              placeholder="e.g. Honda Activa 6G"
              autoComplete="off"
              className="min-h-12 w-full rounded-lg border border-[var(--border)] bg-white px-4 text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10"
            />
          </section>

          <section>
            <h2 className="section-label mb-3">INSPECTION TYPE</h2>

            <div className="space-y-3">
              {INSPECTION_OPTIONS.map((option) => {
                const selected = inspectionType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInspectionType(option.value)}
                    aria-pressed={selected}
                    className={[
                      'min-h-20 w-full rounded-xl border p-4 text-left transition-colors',
                      selected
                        ? 'border-[var(--accent)] bg-white ring-1 ring-[var(--accent)]'
                        : 'border-[var(--border)] bg-white hover:bg-[var(--surface-subtle)]',
                    ].join(' ')}
                  >
                    <p className="text-subheading">{option.label}</p>
                    <p className="text-small mt-1">{option.description}</p>
                  </button>
                )
              })}
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-[var(--error)]/20 bg-[var(--error)]/5 p-4"
            >
              <p className="text-small font-medium text-[var(--error)]">
                {error}
              </p>
            </div>
          )}

          <section>
            <PrimaryButton
              fullWidth
              type="submit"
              disabled={isLoading || !assetName.trim()}
            >
              {isLoading ? 'Creating inspection...' : 'Create inspection'}
            </PrimaryButton>
          </section>
        </form>
      </div>
    </div>
  )
}