import { useEffect, useRef, useState } from "react";
import { CircleStop, Video } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import type { AssetType } from "@/services/inspectionService";

const DIRECTIONS: Record<AssetType, string> = {
  scooter: "Slowly pan around the front, both sides, and rear of the scooter.",
  bike: "Slowly pan around the front, both sides, rear, handlebars, and frame.",
  apartment: "Slowly scan the entrance, living space, kitchen, bedroom, bathroom, and balcony.",
  house: "Slowly scan the entrance, living spaces, kitchen, bedrooms, bathrooms, stairs, and outdoor area.",
  wall: "Slowly scan the full wall from left to right, including the lower edge and any visible marks or fixtures.",
};

export default function ContextVideoCapture({ assetType, onRecorded, isSaving = false }: { assetType: AssetType; onRecorded: (file: Blob, durationSeconds: number) => void; isSaving?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const startedAtRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      setError("Camera access is unavailable. Allow camera access to record the context video.");
    }
  }

  function startRecording() {
    if (!streamRef.current || !window.MediaRecorder) {
      setError("This browser cannot record context video.");
      return;
    }
    chunksRef.current = [];
    const mimeType = ["video/webm;codecs=vp8", "video/webm", "video/mp4", "video/quicktime"].find((candidate) => MediaRecorder.isTypeSupported(candidate));
    try {
      const recorder = mimeType ? new MediaRecorder(streamRef.current, { mimeType }) : new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
    recorder.onstop = () => {
      const duration = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      onRecorded(new Blob(chunksRef.current, { type: mimeType }), duration);
      setRecording(false);
    };
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    recorder.start();
    setRecording(true);
    window.setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 15000);
    } catch {
      setError("This browser could not start video recording. Try the camera again or use another browser.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void startCamera(); }, 0);
    return () => { window.clearTimeout(timer); streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, []);

  return <section className="card space-y-4 p-4"><div className="flex items-start gap-3"><Video className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" /><div><h2 className="text-subheading">Context video</h2><p className="text-small mt-1">One short visual record adds context around the photos. It is stored for review and is not AI analyzed.</p></div></div><p className="text-body">{DIRECTIONS[assetType]}</p><div className="relative aspect-video overflow-hidden rounded-lg bg-black"><video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />{!ready && <p className="absolute inset-0 flex items-center justify-center text-small text-white">Starting camera...</p>}</div>{error && <p className="text-small text-[var(--error)]" role="alert">{error}</p>}<PrimaryButton type="button" fullWidth onClick={() => recording ? recorderRef.current?.stop() : startRecording()} disabled={!ready || isSaving}>{recording ? <><CircleStop className="h-5 w-5" aria-hidden="true" />Stop and save video</> : isSaving ? "Saving context video..." : "Record context video"}</PrimaryButton></section>;
}
