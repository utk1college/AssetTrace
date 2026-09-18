import { Link } from 'react-router-dom'
import { Bike, Building2, ChevronRight, House, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PrimaryButton from '../components/ui/PrimaryButton'
import EmptyState from '../components/feedback/EmptyState'

const ASSET_ICONS: Record<string, LucideIcon> = { Scooter: Bike, Bike, Apartment: Building2, House, 'Studio Apartment': Building2 }
const mockInspections = [
  { id: '1', assetType: 'Scooter', assetName: 'Honda Activa', otherParty: 'Rahul Kumar', inspectionType: 'Move-in', status: 'In progress', completedAreas: 4, totalAreas: 8 },
  { id: '2', assetType: 'Apartment', assetName: '2BHK Koramangala', otherParty: 'Priya Sharma', inspectionType: 'Move-out', status: 'Ready to confirm', completedAreas: 6, totalAreas: 6 },
]
const mockReports = [
  { id: '3', assetType: 'Bike', assetName: 'Royal Enfield', otherParty: 'Amit Patel', completedAt: '2 days ago', changesDetected: 0 },
  { id: '4', assetType: 'Studio Apartment', assetName: 'Studio HSR Layout', otherParty: 'Sneha Reddy', completedAt: '8 days ago', changesDetected: 2 },
]

export default function DashboardPage() {
  return <div className="min-h-screen bg-[var(--surface)] pb-24">
    <div className="container py-6">
      <header className="mb-7"><p className="text-small mb-1">Thursday, September 18</p><h1 className="text-display">Your inspections</h1></header>
      <Link to="/inspections/new" className="block mb-8"><PrimaryButton fullWidth><Plus className="h-5 w-5" />Start an inspection</PrimaryButton></Link>
      <section aria-labelledby="active-inspections" className="mb-8"><h2 id="active-inspections" className="section-label mb-3">ACTIVE INSPECTIONS</h2><div className="space-y-3">{mockInspections.map((inspection) => <InspectionCard key={inspection.id} inspection={inspection} />)}</div></section>
      <section id="reports" aria-labelledby="recent-reports"><h2 id="recent-reports" className="section-label mb-3">RECENT REPORTS</h2><div className="space-y-3">{mockReports.map((report) => <ReportCard key={report.id} report={report} />)}</div></section>
      {mockInspections.length === 0 && <EmptyState title="No active inspections" description="Start an inspection to record an asset's condition." actionLabel="Start an inspection" actionLink="/inspections/new" />}
    </div>
  </div>
}

function InspectionCard({ inspection }: { inspection: typeof mockInspections[number] }) {
  const Icon = ASSET_ICONS[inspection.assetType] ?? House
  const percent = Math.round((inspection.completedAreas / inspection.totalAreas) * 100)
  const isComplete = percent === 100
  return <Link to={`/inspections/${inspection.id}`} className="block card-interactive p-4 no-underline">
    <div className="flex items-center gap-3"><span className="asset-icon"><Icon aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-subheading truncate">{inspection.assetName}</p><ChevronRight className="h-5 w-5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" /></div><p className="text-small truncate">{inspection.assetType} · {inspection.otherParty}</p></div></div>
    <div className="mt-4 flex items-center justify-between gap-3"><span className="badge badge-neutral">{inspection.inspectionType}</span><span className={`text-small font-medium ${isComplete ? 'status-success' : 'status-warning'}`}>{inspection.status}</span></div>
    <div className="mt-3"><div className="mb-2 flex items-center justify-between text-tiny"><span>{inspection.completedAreas} of {inspection.totalAreas} areas complete</span><span>{percent}%</span></div><div className="progress-container"><div className={`progress-bar ${isComplete ? '' : 'progress-bar-warning'}`} style={{ width: `${percent}%` }} /></div></div>
  </Link>
}

function ReportCard({ report }: { report: typeof mockReports[number] }) {
  const Icon = ASSET_ICONS[report.assetType] ?? House
  return <Link to={`/inspections/${report.id}/report`} className="block card-interactive p-4 no-underline">
    <div className="flex items-center gap-3"><span className="asset-icon"><Icon aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-subheading truncate">{report.assetName}</p><p className="text-small truncate">{report.assetType} · {report.otherParty}</p></div><ChevronRight className="h-5 w-5 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" /></div>
    <div className="mt-3 flex items-center justify-between"><span className="text-tiny">Completed {report.completedAt}</span>{report.changesDetected > 0 ? <span className="badge badge-warning">{report.changesDetected} changes to review</span> : <span className="text-small status-success">No changes observed</span>}</div>
  </Link>
}
