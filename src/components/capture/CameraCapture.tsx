import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  getCaptureTelemetry,
  startCaptureTelemetry,
} from "@/utils/captureTelemetry";

interface CameraCaptureProps {
  className?: string;
  onCapture: (
    file: Blob,
    telemetry: ReturnType<typeof getCaptureTelemetry>,
  ) => void;
  isSaving?: boolean;
}

export default function CameraCapture({
  className,
  onCapture,
  isSaving = false,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  async function startCamera() {
    setIsStarting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          if (
            videoRef.current &&
            videoRef.current.videoWidth > 0 &&
            videoRef.current.videoHeight > 0
          ) {
            setIsCameraReady(true);
          }
        };
      }
    } catch {
      setError(
        "Camera access is unavailable. Check your camera permission and try again.",
      );
      setIsCameraReady(false);
    } finally {
      setIsStarting(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraReady(false);
  }

  function capturePhoto() {
    const video = videoRef.current;

    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setError("Unable to capture the image. Please try again.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to capture the image. Please try again.");
          return;
        }

        onCapture(blob, getCaptureTelemetry());
      },
      "image/jpeg",
      0.92,
    );
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void startCamera();
    }, 0);
    const stopTelemetry = startCaptureTelemetry();

    return () => {
      window.clearTimeout(timer);
      stopCamera();
      stopTelemetry();
    };
  }, []);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-md)] bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-sm text-white">Starting camera…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--surface)] p-6 text-center">
            <Camera
              className="h-6 w-6 text-[var(--text-secondary)]"
              aria-hidden="true"
            />
            <p className="text-small">{error}</p>
            <PrimaryButton type="button" onClick={() => void startCamera()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try again
            </PrimaryButton>
          </div>
        )}
      </div>

      {!error && !isStarting && (
        <PrimaryButton
          type="button"
          fullWidth
          onClick={capturePhoto}
          disabled={!isCameraReady || isSaving}
        >
          <Camera className="h-5 w-5" aria-hidden="true" />
          {isSaving ? "Saving evidence…" : "Capture"}
        </PrimaryButton>
      )}
    </div>
  );
}
