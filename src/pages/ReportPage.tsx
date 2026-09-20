import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "@/components/feedback/LoadingState";
import inspectionService, { type Comparison, type EvidenceMetadata, type Inspection } from "@/services/inspectionService";

interface ReportData { inspection: Inspection; evidence: EvidenceMetadata[]; comparison: Comparison | null }

export default function ReportPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([inspectionService.getInspection(id), inspectionService.listEvidence(id), inspectionService.getLatestComparison(id)])
      .then(([inspection, evidence, comparison]) => setData({ inspection, evidence, comparison }))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load the report."));
  }, [id]);

  if (error) return <main className="container py-8"><div className="card p-5" role="alert"><h1 className="text-display">Report unavailable</h1><p className="text-body mt-2">{error}</p></div></main>;
  if (!data) return <LoadingState label="Loading condition report" />;

  const baseline = data.evidence.filter((item) => item.phase === "baseline" && item.mediaType !== "video");
  const returned = data.evidence.filter((item) => item.phase === "return" && item.mediaType !== "video");
  const videos = data.evidence.filter((item) => item.mediaType === "video");

  return <main className="container space-y-8 py-6">
    <header><p className="section-label">CONDITION REPORT</p><h1 className="text-display mt-1">{data.inspection.assetName}</h1><p className="text-body mt-2">A reviewable record of what was captured, acknowledged, locked, and observed.</p></header>
    <section className="card space-y-3 p-4"><ReportRow label="Inspection stage" value={data.inspection.returnCompletedAt ? "Transaction frozen" : data.inspection.status === "locked" ? "Baseline locked · Return captured" : data.inspection.status} /><ReportRow label="Baseline acknowledgement" value={data.inspection.acknowledgements ? `${Object.keys(data.inspection.acknowledgements).length} participant(s) acknowledged` : "Not recorded"} /><ReportRow label="Baseline lock" value={data.inspection.lockedAt ? new Date(data.inspection.lockedAt).toLocaleString() : "Not locked"} /><ReportRow label="Evidence records" value={String(data.evidence.length)} /><ReportRow label="Comparison" value={data.comparison ? "Available for review" : "Not run yet"} /></section>
    <section className="card p-4"><h2 className="text-subheading">Evidence integrity</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-small"><li>Each record is tied to this inspection and its baseline or return phase.</li><li>Uploads use short-lived presigned S3 URLs; the browser never receives AWS credentials.</li><li>Every record includes a capture timestamp and SHA-256 digest.</li><li>The capturing participant, GPS availability, media type, and context-video duration are recorded when available.</li><li>Both participants must acknowledge the baseline before it can be locked and made read-only.</li><li>Context video provides an additional human-review layer and is intentionally not analyzed by AI yet.</li></ul></section>
    <EvidenceGroup title="Before photos" evidence={baseline} inspection={data.inspection} />
    <EvidenceGroup title="After photos" evidence={returned} inspection={data.inspection} />
    <section><h2 className="text-subheading mb-3">Context videos</h2><p className="text-small mb-3">One guided video was captured for each phase. Videos are stored for human review and are not AI analyzed.</p>{videos.length ? <div className="space-y-4">{videos.map((item) => <div className="card overflow-hidden p-3" key={item.evidenceId}>{item.viewUrl ? <video controls preload="metadata" className="aspect-video w-full rounded-lg bg-black" src={item.viewUrl} /> : <p className="text-small p-3">Video preview unavailable</p>}<EvidenceMetadataPanel evidence={item} inspection={data.inspection} /></div>)}</div> : <div className="card p-4"><p className="text-small">No context video is available for this report.</p></div>}</section>
    <section><h2 className="text-subheading mb-3">Observed results</h2>{data.comparison ? <div className="space-y-3">{data.comparison.result.changes.map((change) => <div className="card p-4" key={`${change.areaId}-${change.category}`}><div className="flex items-start justify-between gap-3"><strong>{change.capturePointTitle ?? data.evidence.find((item) => item.areaId === change.areaId)?.capturePointTitle ?? change.areaId}</strong><span className="badge badge-warning">{change.status}</span></div><p className="text-body mt-2">{change.explanation}</p><p className="text-small mt-2">Confidence: {Math.round(change.confidence * 100)}%. Human review required.</p></div>)}</div> : <div className="card p-5"><p className="text-body">Run a comparison before treating this report as complete.</p></div>}</section>
    <Link className="btn btn-secondary w-full" to={`/inspections/${id}/compare`}>Open comparison</Link>
  </main>;
}

function EvidenceGroup({ title, evidence, inspection }: { title: string; evidence: EvidenceMetadata[]; inspection: Inspection }) { return <section><h2 className="text-subheading mb-3">{title}</h2>{evidence.length ? <div className="grid gap-4 sm:grid-cols-2">{evidence.map((item) => <div className="card overflow-hidden" key={item.evidenceId}>{item.viewUrl ? <img src={item.viewUrl} alt={`${title} for ${item.capturePointTitle ?? item.areaId}`} className="aspect-[4/3] w-full object-cover" /> : <p className="p-4 text-small">Image preview unavailable</p>}<EvidenceMetadataPanel evidence={item} inspection={inspection} /></div>)}</div> : <div className="card p-4"><p className="text-small">No {title.toLowerCase()} are available.</p></div>}</section> }

function EvidenceMetadataPanel({ evidence, inspection }: { evidence: EvidenceMetadata; inspection: Inspection }) { const capturedBy = evidence.capturedBy === inspection.ownerId ? "Owner" : evidence.capturedBy === inspection.renterId ? "Renter" : evidence.capturedBy ? "Participant identity recorded" : "Participant record"; return <dl className="grid grid-cols-2 gap-x-3 gap-y-2 p-4 text-small"><dt>Phase</dt><dd className="text-right font-medium">{evidence.phase}</dd><dt>Captured</dt><dd className="text-right font-medium">{new Date(evidence.capturedAt).toLocaleString()}</dd><dt>GPS</dt><dd className="text-right font-medium">{evidence.location ? "Available" : "Unavailable"}</dd><dt>SHA-256</dt><dd className="truncate text-right font-mono text-[11px]" title={evidence.sha256}>{evidence.sha256}</dd><dt>Captured by</dt><dd className="truncate text-right font-medium">{capturedBy}</dd>{evidence.durationSeconds !== undefined && <><dt>Duration</dt><dd className="text-right font-medium">{evidence.durationSeconds}s</dd></>}</dl> }

function ReportRow({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0"><span className="text-small">{label}</span><strong className="text-small">{value}</strong></div>; }
