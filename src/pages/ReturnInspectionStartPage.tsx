import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import PrimaryButton from "@/components/ui/PrimaryButton";
import inspectionService, { type EvidenceMetadata } from "@/services/inspectionService";

export default function ReturnInspectionStartPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [assetName, setAssetName] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    void inspectionService
      .getInspection(id)
      .then(async (inspection) => {
        if (inspection.status !== "locked") {
          setError(
            "Return evidence can only be started after the baseline is locked.",
          );
          return;
        }

        setAssetName(inspection.assetName);
        if (user?.id === inspection.ownerId) {
          setIsOwner(true);
          setEvidence(await inspectionService.listEvidence(id, "return"));
        }
      })
      .catch(() => {
        setError("Unable to load the inspection. Please try again.");
      });
  }, [id, user?.id]);

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

  const isRenter = !isOwner;

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
          {isRenter ? "Capture the same areas again so the condition can be compared with the locked baseline." : "Review the renter's return evidence before comparing it with the locked baseline."}
        </p>
      </div>
      {isRenter ? <PrimaryButton type="button" fullWidth onClick={() => navigate(`/inspections/${id}/return/capture`)}>Record return condition</PrimaryButton> : <>
        {evidence.length === 0 ? <p className="text-body">No return evidence has been submitted yet.</p> : <div className="space-y-4">{evidence.map((item) => <figure className="card overflow-hidden" key={item.evidenceId}>{item.viewUrl ? <img src={item.viewUrl} alt={`Return evidence for ${item.areaId}`} className="aspect-[4/3] w-full object-cover" /> : <div className="p-5">Image preview unavailable</div>}<figcaption className="p-4 text-body">{item.areaId}</figcaption></figure>)}<PrimaryButton type="button" fullWidth onClick={() => navigate(`/inspections/${id}/compare`)}>Compare return evidence</PrimaryButton></div>}
      </>}
    </main>
  );
}
