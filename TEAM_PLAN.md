# AssetTrace team handover

**Updated:** September 18, 2026  
**Default mode for every feature owner:** Mock mode (`VITE_USE_MOCK=true`)

This document assigns work without blocking on the backend. Read [README.md](README.md) first for setup and verified project status, then [DESIGN.md](DESIGN.md) before changing UI.

## Working agreement

- Work only on your assigned branch and feature area. Do not rewrite another owner’s screen or shared design tokens without agreement.
- Keep `VITE_USE_MOCK=true` until the team lead announces that the API is deployed, shares the base URL and contract, and asks for real-mode testing.
- Match the service interfaces below in mock and real adapters. Pages and stores import only the selected facade, never a concrete adapter directly.
- Use localStorage only inside mock adapters. Mock calls should resolve asynchronously (roughly 300ms) so loading/error handling is actually exercised.
- UI must follow `DESIGN.md`: Lucide icons, semantic status states, mobile-first layout, 48px touch targets, and no emoji/gradients/AI marketing.
- Test at 375px and 390px, run `npm run build` and `npm run lint`, then open a PR. Add only your handover note (`A.md`, `S.md`, or `Sh.md`) at the repository root.
- Do not turn on real mode, provision resources, or add billable AWS calls without explicit approval from Utku.

## Branches and ownership

| Owner | Branch | Scope | Starts now? |
|---|---|---|---|
| Ashutosh | `feat/auth-service` | Authentication service, store, login, registration, route guard | Yes, mock mode |
| Sarthak | `feat/inspection-service` | Inspection service, store, create/join workflow, session codes | Yes, mock mode |
| Shubham | `feat/camera-capture` | Camera, GPS, telemetry, hashing, capture UI | Yes, mock mode and physical-device testing |
| Utku | `infra/*` | Lambda/API Gateway, API contracts, S3 CORS, IAM, Bedrock, integration | Backend phase |

## Shared data contracts

Keep these client contracts stable. The team lead will publish the final HTTP request/response schema before the real-mode phase.

```ts
type Role = 'owner' | 'renter'
type AssetType = 'scooter' | 'bike' | 'apartment' | 'house'
type InspectionType = 'move-in' | 'move-out'
type InspectionStatus = 'in-progress' | 'awaiting-confirmation' | 'locked'

interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface Inspection {
  id: string
  sessionCode: string
  assetType: AssetType
  assetName: string
  inspectionType: InspectionType
  status: InspectionStatus
  ownerId: string
  renterId?: string
  areas: string[]
  completedAreaIds: string[]
  createdAt: string
}

interface EvidenceMetadata {
  id: string
  inspectionId: string
  areaId: string
  capturedAt: string
  location?: { latitude: number; longitude: number; accuracy: number }
  sha256: string
  suspicious: boolean
}
```

## Ashutosh — authentication

Build `src/services/mock/authMock.ts`, `src/services/real/authReal.ts`, `src/services/authService.ts`, and `src/store/authStore.ts`; then complete `LoginPage.tsx`, `RegisterPage.tsx`, and route protection.

Required facade:

```ts
signUp(name: string, email: string, password: string, role: Role): Promise<User>
signIn(email: string, password: string): Promise<{ user: User; token: string }>
signOut(): Promise<void>
getCurrentUser(): Promise<User | null>
getToken(): string | null
```

Mock mode stores a mock user/token in localStorage and exposes useful validation errors. Real mode must use the provided Cognito pool/client configuration, but do not wire or test it until Utku confirms the expected authentication model and callback/error contract.

Your PR must include `A.md`: completed work, mock test steps, exported types, and any integration question/blocker.

## Sarthak — inspections

Build `src/services/mock/inspectionMock.ts`, `src/services/real/inspectionReal.ts`, `src/services/inspectionService.ts`, `src/store/inspectionStore.ts`, `src/utils/sessionCode.ts`, `src/config/constants.ts`, `CreateInspectionPage.tsx`, and `JoinInspectionPage.tsx`.

Required facade:

```ts
createInspection(input: Pick<Inspection, 'assetType' | 'assetName' | 'inspectionType'>): Promise<Inspection>
getInspection(id: string): Promise<Inspection>
listInspections(userId: string): Promise<Inspection[]>
joinInspection(sessionCode: string): Promise<Inspection>
updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection>
```

Generate six-character uppercase codes without ambiguous characters (`0/O`, `1/I`, `5/S`, `8/B`). Include documented inspection areas for each asset type. The success state should show a session code and QR code; invalid-code and empty states are required.

Your PR must include `S.md`: completed work, mock test steps, inspection type/interface, session-code behaviour, and backend questions.

## Shubham — camera and evidence

Build `useCamera`, `useGeolocation`, `useTelemetry`, `sha256`, anti-spoofing utilities, `CameraCapture`, `CaptureStatus`, and `CaptureScreen`.

The camera experience is focused: large camera preview, a concise area instruction, step count, one capture control, and quiet readiness indicators. It does not display raw telemetry or hashes. Implement explicit states for camera denial, unavailable GPS, unsupported device sensors, and unsaved/upload-failed captures.

Requirements:

- Request camera and location permissions only in response to a user action.
- Capture only from a live `MediaStream`; do not provide gallery upload as an alternative.
- Hash captured blobs with Web Crypto.
- Run one random tilt challenge per inspection; treat it as a signal, not proof.
- Test on at least one physical mobile device and document browser limitations.

Your PR must include `Sh.md`: completed work, mobile test steps, evidence shape, implemented checks, browser notes, and backend questions.

## Utku — backend release gate

The following AWS resources have been verified in `us-east-1`: Cognito pool `assettrace-users`, its app client, DynamoDB tables `AssetTrace-Inspections`, `AssetTrace-Evidence`, and `AssetTrace-Comparisons`, S3 bucket `assettrace-evidence-650687536843`, and IAM group `assettrace-devs` with all three teammate users.

Before teammates can use real mode, complete and document all of the following:

1. Deploy Lambda functions and an API Gateway API. No Lambda or API Gateway API exists at this handover.
2. Configure a Cognito JWT authorizer and CORS for the frontend origin.
3. Configure bucket CORS for browser `PUT` uploads to presigned URLs. It is currently absent.
4. Define and share exact request/response shapes, error codes, authorization rules, and the API base URL.
5. Implement endpoints: auth register/login; inspection create/list/get/join; evidence presigned upload URL and metadata save; acknowledge/lock; comparison trigger/get.
6. Verify least-privilege Lambda roles, evidence ownership checks, and that a locked baseline cannot be changed.
7. Add CloudWatch logs/error visibility and test the browser flow with `VITE_USE_MOCK=false`.

Publish this in `U.md` before requesting real-mode work: API base URL, endpoint contracts, auth/token handling, S3 upload CORS/headers, DynamoDB key/index assumptions, test instructions, and known limitations.

## Merge and handover checklist

Feature owners may work in parallel in mock mode now. Merge mock-mode work after review. Real adapters can be merged only after `U.md` is available and the lead has completed an integration test.

- [ ] UI matches `DESIGN.md`.
- [ ] Mock mode works with no AWS calls.
- [ ] Loading, empty, validation, permission, and recovery states are covered where relevant.
- [ ] `npm run build` and `npm run lint` pass.
- [ ] Mobile layout is checked at 375px and 390px.
- [ ] Handover note is included and scoped to the assigned feature.
