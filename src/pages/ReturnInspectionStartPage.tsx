import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PrimaryButton from "@/components/ui/PrimaryButton";
import inspectionService from "@/services/inspectionService";

export default function ReturnInspectionStartPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assetName, setAssetName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    void inspectionService
      .getInspection(id)
      .then((inspection) => {
        if (inspection.status !== "locked") {
          setError(
            "Return evidence can only be started after the baseline is locked.",
          );
          return;
        }

        setAssetName(inspection.assetName);
      })
      .catch(() => {
        setError("Unable to load the inspection. Please try again.");
      });
  }, [id]);

  if (error) {
    return (
      <main className="container py-6">
        <p className="text-[var(--error)]">{error}</p>
      </main>
    );
  }

  if (!assetName) {
    return (
      <main className="container py-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Loading inspection…
        </p>
      </main>
    );
  }

  return (
    <main className="container py-6">
      <div className="mb-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Return inspection
        </p>

        <h1 className="mt-1 text-xl font-semibold text-[var(--text)]">
          {assetName}
        </h1>

        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Capture the same areas again so the condition can be compared with the
          locked baseline.
        </p>
      </div>

      <PrimaryButton
        type="button"
        fullWidth
        onClick={() => navigate(`/inspections/${id}/return/capture`)}
      >
        Start return capture
      </PrimaryButton>
    </main>
  );
}
