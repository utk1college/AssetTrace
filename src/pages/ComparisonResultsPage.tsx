import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RefreshCw, Search } from "lucide-react";
import LoadingState from "@/components/feedback/LoadingState";
import SecondaryButton from "@/components/ui/SecondaryButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import inspectionService, { type Comparison, type EvidenceMetadata, type Inspection } from "@/services/inspectionService";
import { useAuthStore } from "@/store/authStore";

export default function ComparisonResultsPage() {
  const { id = "" } = useParams();
  const user = useAuthStore((state) => state.user);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [baseline, setBaseline] = useState<EvidenceMetadata[]>([]);
  const [returned, setReturned] = useState<EvidenceMetadata[]>([]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [nextInspection, nextBaseline, nextReturn, latest] = await Promise.all([
        inspectionService.getInspection(id),
        inspectionService.listEvidence(id, "baseline"),
        inspectionService.listEvidence(id, "return"),
        inspectionService.getLatestComparison(id),
      ]);
      setInspection(nextInspection);
      setBaseline(nextBaseline);
      setReturned(nextReturn);
      setComparison(latest);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load comparison data.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function runComparison() {
    if (!id) return;
    setIsComparing(true);
    setError(null);
    try {
      setComparison(await inspectionService.compareInspection(id, baseline, returned));
    } catch (compareError) {
      setError(compareError instanceof Error ? compareError.message : "Comparison could not be completed.");
    } finally {
      setIsComparing(false);
    }
  }

  if (isLoading) return <LoadingState label="Loading comparison" />;
  if (!inspection) return <ErrorPanel message={error ?? "Inspection not found."} onRetry={() => void load()} />;

  return (
    <main className="container space-y-8 py-6">
      <header><p className="section-label">COMPARISON</p><h1 className="text-display mt-1">{inspection.assetName}</h1><p className="text-body mt-2">Review visible differences between the locked baseline and return evidence.</p></header>
      {error && <div className="card p-4 text-small text-[var(--error)]" role="alert">{error}</div>}
      <section className="card space-y-3 p-4">
        <div className="flex justify-between gap-3"><span className="text-body">Baseline evidence</span><strong>{baseline.length}</strong></div>
        <div className="flex justify-between gap-3"><span className="text-body">Return evidence</span><strong>{returned.length}</strong></div>
        {user?.id === inspection.ownerId ? <PrimaryButton fullWidth onClick={() => void runComparison()} disabled={isComparing || !baseline.length || !returned.length || inspection.status !== "locked"}><Search className="h-5 w-5" aria-hidden="true" />{isComparing ? "Comparing evidence" : comparison ? "Run comparison again" : "Compare evidence"}</PrimaryButton> : <p className="text-small">The owner will compare the return evidence and publish the report.</p>}
        {inspection.status !== "locked" && <p className="text-small">Lock the baseline before comparing evidence.</p>}
        {(!baseline.length || !returned.length) && <p className="text-small">Both baseline and return evidence are required.</p>}
      </section>
      {comparison ? <section className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="text-subheading">Observed changes</h2><span className="text-small">Reviewable result</span></div>{comparison.result.changes.map((change) => <Link key={`${change.areaId}-${change.category}`} to={`/inspections/${id}/compare/${encodeURIComponent(change.areaId)}`} className="card block p-4 hover:border-[var(--accent)]"><div className="flex items-start justify-between gap-3"><div><h3 className="text-subheading">{change.areaId}</h3><p className="text-small mt-1">{change.category}</p></div><span className="badge badge-warning">{change.status}</span></div><p className="text-body mt-3">{change.explanation}</p></Link>)}</section> : <div className="card p-5"><h2 className="text-subheading">No comparison yet</h2><p className="text-body mt-2">Run the comparison after both evidence sets are available.</p></div>}
      <Link className="btn btn-secondary w-full" to={`/inspections/${id}/report`}>Open condition report</Link>
    </main>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <main className="container py-8"><div className="card p-5" role="alert"><h1 className="text-display">We couldn’t load comparison</h1><p className="text-body mt-2">{message}</p><SecondaryButton className="mt-5" onClick={onRetry}><RefreshCw className="h-4 w-4" aria-hidden="true" />Try again</SecondaryButton></div></main>;
}
