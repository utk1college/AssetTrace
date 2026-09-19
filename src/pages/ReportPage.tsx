import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "@/components/feedback/LoadingState";
import inspectionService, { type Comparison, type EvidenceMetadata, type Inspection } from "@/services/inspectionService";

export default function ReportPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<{ inspection: Inspection; evidence: EvidenceMetadata[]; comparison: Comparison | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void Promise.all([inspectionService.getInspection(id), inspectionService.listEvidence(id), inspectionService.getLatestComparison(id)]).then(([inspection, evidence, comparison]) => setData({ inspection, evidence, comparison })).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load the report.")); }, [id]);
  if (error) return <main className="container py-8"><div className="card p-5" role="alert"><h1 className="text-display">Report unavailable</h1><p className="text-body mt-2">{error}</p></div></main>;
  if (!data) return <LoadingState label="Loading condition report" />;
  return <main className="container space-y-8 py-6"><header><p className="section-label">CONDITION REPORT</p><h1 className="text-display mt-1">{data.inspection.assetName}</h1><p className="text-body mt-2">Evidence-backed observations from the inspection.</p></header><section className="card space-y-3 p-4"><ReportRow label="Inspection status" value={data.inspection.status} /><ReportRow label="Evidence records" value={String(data.evidence.length)} /><ReportRow label="Comparison" value={data.comparison ? "Available for review" : "Not run yet"} /></section><section><h2 className="text-subheading mb-3">Observed results</h2>{data.comparison ? <div className="space-y-3">{data.comparison.result.changes.map((change) => <div className="card p-4" key={`${change.areaId}-${change.category}`}><div className="flex items-start justify-between gap-3"><strong>{change.areaId}</strong><span className="badge badge-warning">{change.status}</span></div><p className="text-body mt-2">{change.explanation}</p></div>)}</div> : <div className="card p-5"><p className="text-body">Run a comparison before treating this report as complete.</p></div>}</section><Link className="btn btn-secondary w-full" to={`/inspections/${id}/compare`}>Open comparison</Link></main>;
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0"><span className="text-small">{label}</span><strong className="text-small">{value}</strong></div>;
}
