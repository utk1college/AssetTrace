import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CameraCapture from "@/components/capture/CameraCapture";
import inspectionService from "@/services/inspectionService";
import { getCurrentLocation, sha256Blob } from "@/utils/captureEvidence";

import { getCaptureTelemetry } from "@/utils/captureTelemetry";
import { useAuthStore } from "@/store/authStore";

export default function CaptureScreen() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const phase = location.pathname.includes("/return") ? "return" : "baseline";
  const [areas, setAreas] = useState<string[]>([]);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [pendingFile, setPendingFile] = useState<Blob | null>(null);
  const [locationRecorded, setLocationRecorded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!id) {
        setError("Inspection could not be found.");
        return;
      }

      void inspectionService
        .getInspection(id)
        .then((inspection) => {
          const canCapture = phase === "baseline"
            ? user?.id === inspection.ownerId
            : user?.id === inspection.renterId;
          if (!canCapture) {
            setError(phase === "baseline"
              ? "Only the owner can record the baseline evidence."
              : "Only the renter can record return evidence.");
            return;
          }
          if (phase === "return" && inspection.status !== "locked") {
            setError(
              "Return evidence can only be captured after the baseline is locked.",
            );
            return;
          }

          if (phase === "baseline" && inspection.status === "locked") {
            setError("Baseline evidence is already locked.");
            return;
          }

          setAreas(inspection.areas);
        })
        .catch(() => {
          setError("Unable to load the inspection. Please try again.");
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [id, phase, user?.id]);

  async function saveEvidence(file: Blob) {
    const areaId = areas[currentAreaIndex];

    if (!id || !areaId) {
      setError("Unable to save this evidence. Please try again.");
      return;
    }

    setError(null);
    setIsSaved(false);
    setIsSaving(true);

    try {
      const [sha256, location] = await Promise.all([
        sha256Blob(file),
        getCurrentLocation(),
      ]);

      setLocationRecorded(Boolean(location));

      const capturedAt = new Date().toISOString();

      const upload = await inspectionService.requestEvidenceUploadUrl(id, {
        areaId,
        contentType: file.type,
        phase,
      });

      await inspectionService.uploadEvidence(upload.uploadUrl, file, file.type);

      await inspectionService.saveEvidence(id, {
        evidenceId: upload.evidenceId,
        areaId,
        phase,
        key: upload.key,
        sha256,
        capturedAt,
        location,
        suspicious: false,
      });

      setIsSaved(true);
      setPendingFile(null);

      if (currentAreaIndex < areas.length - 1) {
        setCurrentAreaIndex((index) => index + 1);
        setIsSaved(false);
      } else {
        setIsComplete(true);
      }
    } catch {
      setError("Unable to save the captured evidence. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCapture(
    file: Blob,
    _telemetry: ReturnType<typeof getCaptureTelemetry>,
  ) {
    setPendingFile(file);
    await saveEvidence(file);
  }
  if (isComplete) {
    return (
      <main className="container py-6">
        <h1 className="text-xl font-semibold text-[var(--text)]">
          Capture complete
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Evidence recorded for all areas.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-5 w-full"
          onClick={() => navigate(phase === "return" ? `/inspections/${id}/compare` : `/inspections/${id}/review`)}
        >
          {phase === "return" ? "Review comparison" : "Review baseline"}
        </button>
      </main>
    );
  }

  if (!areas.length) {
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
      <div className="mb-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Area {currentAreaIndex + 1} of {areas.length}
        </p>

        <h1 className="mt-1 text-xl font-semibold text-[var(--text)]">
          {areas[currentAreaIndex]}
        </h1>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Capture a clear photo of this area.
        </p>
        {error && (
          <div className="mt-2">
            <p className="text-sm text-[var(--error)]">{error}</p>
            {pendingFile && (
              <button
                type="button"
                className="mt-2 text-sm font-medium text-[var(--accent)]"
                onClick={() => void saveEvidence(pendingFile)}
                disabled={isSaving}
              >
                Try saving again
              </button>
            )}
          </div>
        )}
        {isSaved && locationRecorded && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Location recorded
          </p>
        )}
      </div>

      <CameraCapture onCapture={handleCapture} isSaving={isSaving} />
    </main>
  );
}
