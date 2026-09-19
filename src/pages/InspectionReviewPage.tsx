import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";
import LoadingState from "@/components/feedback/LoadingState";
import EvidenceCard from "@/components/evidence/EvidenceCard";
import VerificationStatus from "@/components/evidence/VerificationStatus";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import inspectionService, { type EvidenceMetadata, type Inspection } from "@/services/inspectionService";

export default function InspectionReviewPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [evidence, setEvidence] = useState<EvidenceMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextInspection, nextEvidence] = await Promise.all([
        inspectionService.getInspection(id),
        inspectionService.listEvidence(id, "baseline"),
      ]);
      setInspection(nextInspection);
      setEvidence(nextEvidence);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load evidence review.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (isLoading) return <LoadingState label="Loading inspection evidence" />;
  if (!inspection) return <main className="container py-8"><div className="card p-5" role="alert"><h1 className="text-display">We couldn’t load this inspection</h1><p className="text-body mt-2">{error ?? "Inspection not found."}</p><SecondaryButton className="mt-5" onClick={() => void load()}><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</SecondaryButton></div></main>;
  const capturedAreas = new Set(evidence.map((item) => item.areaId));
  const capturedCount = inspection.areas.filter((area) => capturedAreas.has(area)).length;
  const progress = inspection.areas.length ? Math.round((capturedCount / inspection.areas.length) * 100) : 0;

  return <main className="container space-y-8 py-6"><header><p className="section-label">EVIDENCE REVIEW</p><h1 className="text-display mt-1">Review {inspection.assetName}</h1><p className="text-body mt-2">Check each captured area before both parties confirm the baseline.</p></header>{error && <div className="card p-4 text-small text-[var(--error)]" role="alert">{error}</div>}<section className="card space-y-4 p-4"><div className="flex items-baseline justify-between gap-3"><h2 className="text-subheading">Captured-area progress</h2><span className="text-small">{capturedCount} of {inspection.areas.length} areas · {progress}%</span></div><div className="progress-container" aria-label={`${progress}% of areas captured`}><div className={`progress-bar ${progress < 100 ? "progress-bar-warning" : ""}`} style={{ width: `${progress}%` }} /></div><p className="text-small">{capturedCount === inspection.areas.length ? "All areas have capture records." : "Complete the remaining areas before confirming."}</p></section><section><div className="mb-2 flex items-center justify-between"><h2 className="text-subheading">Area checklist</h2><span className="text-small">Evidence count: {evidence.length}</span></div><div className="card px-4">{inspection.areas.map((area) => <EvidenceCard key={area} area={area} captured={capturedAreas.has(area)} />)}</div></section><section><h2 className="text-subheading mb-2">Verification status</h2><VerificationStatus hasWarnings={evidence.some((item) => item.suspicious)} /></section><div className="space-y-3"><PrimaryButton fullWidth onClick={() => navigate(`/inspections/${id}/verify`)} disabled={capturedCount < inspection.areas.length}><ArrowRight className="h-5 w-5" aria-hidden="true" />Continue to confirmation</PrimaryButton>{capturedCount < inspection.areas.length && <p className="text-small text-center">Finish capturing all areas to continue.</p>}<Link className="btn btn-secondary w-full" to={`/inspections/${id}`}>Back to inspection</Link></div></main>;
}
