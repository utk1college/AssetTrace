import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LoadingState from "@/components/feedback/LoadingState";
import inspectionService, { type ComparisonChange } from "@/services/inspectionService";

export default function ComparisonDetailPage() {
  const { id = "", area = "" } = useParams();
  const [change, setChange] = useState<ComparisonChange | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void inspectionService.getLatestComparison(id).then((comparison) => setChange(comparison?.result.changes.find((item) => item.areaId === area) ?? null)).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load this comparison."));
  }, [area, id]);

  if (error) return <main className="container py-8"><div className="card p-5" role="alert"><h1 className="text-display">Comparison unavailable</h1><p className="text-body mt-2">{error}</p></div></main>;
  if (!change) return <LoadingState label="Loading comparison detail" />;
  return <main className="container space-y-6 py-6"><header><p className="section-label">AREA DETAIL</p><h1 className="text-display mt-1">{change.areaId}</h1><p className="text-body mt-2">{change.category}</p></header><section className="card p-5"><span className="badge badge-warning">{change.status}</span><p className="text-body mt-4">{change.explanation}</p><p className="text-small mt-4">Confidence: {Math.round(change.confidence * 100)}%. Treat this as an observation for human review.</p></section><Link className="btn btn-secondary w-full" to={`/inspections/${id}/compare`}>Back to comparison</Link></main>;
}
