import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CameraCapture from "@/components/capture/CameraCapture";
import ContextVideoCapture from "@/components/capture/ContextVideoCapture";
import inspectionService, { type CapturePoint } from "@/services/inspectionService";
import { getCurrentLocation, sha256Blob } from "@/utils/captureEvidence";

import { getCaptureTelemetry } from "@/utils/captureTelemetry";
import { useAuthStore } from "@/store/authStore";

export default function CaptureScreen() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const phase = location.pathname.includes("/return") ? "return" : "baseline";
  const [capturePoints, setCapturePoints] = useState<CapturePoint[]>([]);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [pendingFile, setPendingFile] = useState<Blob | null>(null);
  const [locationRecorded, setLocationRecorded] = useState(false);
  const [assetType, setAssetType] = useState<"scooter" | "bike" | "apartment" | "house" | "wall" | "custom">("bike");
  const [videoSaved, setVideoSaved] = useState(false);
  const [isVideoSaving, setIsVideoSaving] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<Blob | null>(null);
  const [pendingVideoDuration, setPendingVideoDuration] = useState(0);

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

          setCapturePoints(inspection.capturePoints.length
            ? [...inspection.capturePoints].sort((left, right) => left.order - right.order)
            : inspection.areas.map((title, order) => ({ id: `area-${order + 1}`, title, order })));
          setAssetType(inspection.assetType);
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
    const capturePoint = capturePoints[currentAreaIndex];
    const areaId = capturePoint?.id;

    if (!id || !capturePoint) {
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
        capturePointId: capturePoint.id,
        contentType: file.type,
        phase,
      });

      await inspectionService.uploadEvidence(upload.uploadUrl, file, file.type);

      await inspectionService.saveEvidence(id, {
        evidenceId: upload.evidenceId,
        areaId,
        capturePointId: capturePoint.id,
        capturePointTitle: capturePoint.title,
        phase,
        key: upload.key,
        sha256,
        capturedAt,
        location,
        suspicious: false,
      });

      setIsSaved(true);
      setPendingFile(null);

      if (currentAreaIndex < capturePoints.length - 1) {
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
  async function saveContextVideo(file: Blob, durationSeconds: number) {
    if (!id) return;
    setPendingVideo(file);
    setPendingVideoDuration(durationSeconds);
    setIsVideoSaving(true);
    setError(null);
    try {
      const [sha256, location] = await Promise.all([sha256Blob(file), getCurrentLocation()]);
      const upload = await inspectionService.requestEvidenceUploadUrl(id, { areaId: "context-video", capturePointId: "context-video", contentType: file.type, phase, mediaType: "video" });
      await inspectionService.uploadEvidence(upload.uploadUrl, file, file.type);
      await inspectionService.saveEvidence(id, { evidenceId: upload.evidenceId, areaId: "context-video", capturePointId: "context-video", capturePointTitle: "Context video", phase, key: upload.key, sha256, capturedAt: new Date().toISOString(), location, suspicious: false, mediaType: "video", durationSeconds });
      setVideoSaved(true);
      setPendingVideo(null);
    } catch {
      setError("Unable to save the context video. Please try again.");
    } finally {
      setIsVideoSaving(false);
    }
  }
  if (isComplete) {
    return (
      <main className="container py-6">
        {!videoSaved ? <><h1 className="text-xl font-semibold text-[var(--text)]">Photos complete</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Add one short context video before continuing.</p>{error && <p className="mt-3 text-sm text-[var(--error)]" role="alert">{error}</p>}{pendingVideo && error && <button type="button" className="mt-2 text-sm font-medium text-[var(--accent)]" onClick={() => void saveContextVideo(pendingVideo, pendingVideoDuration)} disabled={isVideoSaving}>Try saving the recorded video again</button>}<div className="mt-5"><ContextVideoCapture assetType={assetType} onRecorded={saveContextVideo} isSaving={isVideoSaving} /></div></> : <><h1 className="text-xl font-semibold text-[var(--text)]">Capture complete</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Photos and context video recorded for the {phase} phase.</p><button type="button" className="btn btn-primary mt-5 w-full" onClick={() => navigate(phase === "return" ? `/inspections/${id}/compare` : `/inspections/${id}/review`)}>{phase === "return" ? "Review comparison" : "Review baseline"}</button></>}
      </main>
    );
  }

  if (!capturePoints.length) {
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
          Photo {currentAreaIndex + 1} of {capturePoints.length}
        </p>

        <h1 className="mt-1 text-xl font-semibold text-[var(--text)]">
          {capturePoints[currentAreaIndex].title}
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
