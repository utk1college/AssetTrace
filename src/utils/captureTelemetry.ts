export interface CaptureTelemetry {
  orientation?: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  };
  motion?: {
    accelerationX: number | null;
    accelerationY: number | null;
    accelerationZ: number | null;
  };
}

let latestOrientation: CaptureTelemetry["orientation"];
let latestMotion: CaptureTelemetry["motion"];

function handleOrientation(event: DeviceOrientationEvent) {
  latestOrientation = {
    alpha: event.alpha,
    beta: event.beta,
    gamma: event.gamma,
  };
}

function handleMotion(event: DeviceMotionEvent) {
  latestMotion = {
    accelerationX: event.acceleration?.x ?? null,
    accelerationY: event.acceleration?.y ?? null,
    accelerationZ: event.acceleration?.z ?? null,
  };
}

export function startCaptureTelemetry(): () => void {
  latestOrientation = undefined;
  latestMotion = undefined;

  window.addEventListener("deviceorientation", handleOrientation);
  window.addEventListener("devicemotion", handleMotion);

  return () => {
    window.removeEventListener("deviceorientation", handleOrientation);
    window.removeEventListener("devicemotion", handleMotion);
  };
}

export function getCaptureTelemetry(): CaptureTelemetry {
  return {
    orientation: latestOrientation,
    motion: latestMotion,
  };
}
