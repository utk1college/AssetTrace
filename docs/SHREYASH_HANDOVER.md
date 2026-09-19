# Shreyash — Camera Evidence Handover

## Branch

`feat/camera-evidence`

## Implemented

- Camera-first live capture using `getUserMedia`.
- Rear-facing camera preferred.
- No gallery/file-upload fallback.
- Camera permission/error handling with retry.
- Camera readiness check before capture.
- Capture button disabled until camera is ready.
- Area-by-area guided capture with `Area X of Y`.
- Baseline evidence capture flow.
- Return evidence capture flow.
- Return capture restricted until baseline is locked.
- Baseline capture restricted after inspection lock.
- JPEG image generation from camera frames.
- SHA-256 hash generation using Web Crypto API.
- Capture timestamp generation.
- Browser geolocation capture with latitude, longitude, and accuracy.
- Direct upload to S3 using backend-provided presigned URLs.
- Evidence metadata save after successful upload.
- Upload failure handling with retry.
- Capture completion state.
- Camera loading and saving states.
- Device orientation telemetry collection.
- Device motion telemetry collection.
- Preserved mock and real inspection service adapters.
- Added evidence upload/save methods to the inspection service facade.
- Added capture and return routes.

## Files

- `src/App.tsx`
- `src/components/capture/CameraCapture.tsx`
- `src/pages/CaptureScreen.tsx`
- `src/pages/ReturnInspectionStartPage.tsx`
- `src/services/inspectionService.ts`
- `src/services/mock/inspectionMock.ts`
- `src/services/real/inspectionReal.ts`
- `src/utils/captureEvidence.ts`
- `src/utils/captureTelemetry.ts`

## API Integration

### Request upload URL

`POST /inspections/{inspectionId}/evidence/upload-url`

Parameters:

- `areaId`
- `contentType`
- `phase`

### Save evidence

`POST /inspections/{inspectionId}/evidence`

Parameters:

- `evidenceId`
- `areaId`
- `phase`
- `key`
- `sha256`
- `capturedAt`
- `location`
- `suspicious`

## Evidence Upload Flow

1. Capture image from live camera.
2. Generate SHA-256 hash.
3. Capture location metadata.
4. Request presigned S3 upload URL.
5. Upload JPEG directly to S3.
6. Save evidence metadata through the backend.

## Validation

### Lint

`npm run lint`

Result: PASS

- 0 warnings
- 0 errors

### Build

`npm run build`

Result: PASS

### Evidence Test

- Camera capture: PASS
- JPEG generation: PASS
- SHA-256 generation: PASS
- Presigned upload URL: PASS
- S3 upload: PASS
- Evidence metadata save: PASS
- GPS metadata: PASS
- Upload retry: PASS
- Baseline capture: PASS
- Return capture: PASS

### GPS Test

Chrome DevTools Sensors simulated:

- Latitude: `12.9716`
- Longitude: `77.5946`
- Accuracy: `150 m`

The saved backend evidence contained the location metadata.

## Telemetry

Device orientation and motion telemetry are collected during capture.

Telemetry is currently collected on the frontend and is not persisted because the existing backend evidence-save contract does not include telemetry fields.

## Backend / Infrastructure

No AWS infrastructure changes were made.
