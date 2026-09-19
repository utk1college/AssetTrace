# AssetTrace implementation plan

**Updated:** September 19, 2026
**UI authority:** [DESIGN.md](DESIGN.md) is the single source of truth for every product interface.
**Current integration mode:** Real mode is available at the deployed API; mock mode remains useful for isolated UI work.

Read [README.md](README.md) first for the product flow and environment setup, then read `DESIGN.md` before changing any page or component.

## Current baseline — complete

The following foundation work is complete and is no longer active feature work:

- Cognito registration, email confirmation, login, sign-out, protected routes, and real-session restoration.
- Real and mock authentication adapters selected by `VITE_USE_MOCK`.
- Inspection create, get, list, join, session-code, and local mock support.
- Deployed API Gateway/Lambda, Cognito JWT authorizer, DynamoDB tables, S3 presigned-upload route, acknowledgement, baseline lock, and Bedrock comparison route.
- Browser integration for real-mode authentication and inspection creation/joining.
- Session-code compatibility for both legacy hexadecimal codes and new unambiguous codes.

The known verified deployment is:

```text
VITE_USE_MOCK=false
VITE_API_ENDPOINT=https://5v3g0fkokj.execute-api.us-east-1.amazonaws.com/prod
```

The remaining product work follows the README flow:

```text
Capture → Verify → Acknowledge → Lock → Return → Compare → Report
```

## Working agreement

- Work only in the assigned branch and scope. Coordinate before changing a shared type, routing, service facade, shared component, or design token.
- Preserve both modes. Mock adapters may use `localStorage`; real adapters must use the deployed API and must never embed AWS credentials.
- Pages and stores import only facades, never a concrete mock or real adapter directly.
- Use the real API only for scoped integration checks. Do not create, deploy, or modify AWS resources without Utkrisht’s explicit approval. Do not invoke Bedrock outside the agreed comparison test.
- `DESIGN.md` wins over existing UI if they conflict. Use Lucide icons, sentence case, mobile-first composition, 48px targets, semantic status text, and loading/empty/recoverable-error states.
- Test at 375px and 390px. Run `npm run build` and `npm run lint` (or the project-local equivalents if the npm launcher is unavailable) before handoff.
- Do not commit `.env.local`, AWS credentials, tokens, screenshots containing user data, or generated SAM build output.

## AI-agent context protocol

Every teammate should give their AI agent this context before starting work:

1. Read `README.md`, `DESIGN.md`, this plan, and the owner’s prior handover note.
2. Inspect `git status` first; preserve unrelated changes and never reset, restore, or rewrite another owner’s work.
3. Stay inside the assigned files and named API contract. Ask before widening scope.
4. Use `apply_patch` for source edits. Do not silently change environment configuration, credentials, CloudFormation, Cognito, or S3 settings.
5. For UI work, treat `DESIGN.md` as authoritative. Do not add emojis, gradients, dashboards, fake data, raw hashes, or unsupported authenticity/legal claims.
6. For async work, include loading, empty, permission-denied, validation, and recovery states. Preserve an unsaved capture locally if upload fails.
7. Validate with the prescribed checks, record exact manual test steps, and add a concise handover note containing completed work, files changed, API assumptions, and remaining blockers.

## Next feature set and ownership

| Owner | Branch | Active scope | Dependencies | Definition of done |
|---|---|---|---|---|
| Abdul | `feat/inspection-workflow` | Replace static dashboard data with the inspection facade; implement inspection workflow/detail and checklist progress using create/get/list results. | Existing auth and inspection services. | Owner sees live inspections, states are handled, and a created or joined inspection opens a usable workflow screen. |
| Saahya | `feat/verification-lock` | Build the review, joint acknowledgement, and baseline-lock flow using authenticated inspection state. Add a small facade/store boundary for acknowledge/lock if needed. | Utkrisht confirms response shapes for acknowledge/lock; Abdul exposes the workflow hand-off. | Both roles see review state, acknowledgement is explicit, lock is disabled until both acknowledge, and locked state is clear. |
| Shreyash | `feat/camera-evidence` | Complete camera-first guided capture, geolocation/telemetry, SHA-256, capture readiness, and resilient baseline/return evidence upload flow. | Utkrisht’s evidence endpoint contract; physical-device testing. | Live camera only, no gallery fallback, device permission/error states, direct presigned upload, metadata save, and documented mobile test results. |
| Utkrisht | `infra/next-phase` | Publish and implement the remaining read contracts: inspection evidence listing, comparison retrieval/report data, and any response fields required by the three frontend flows. Verify return evidence save and one controlled Bedrock comparison run. | Coordinate request/response shapes before frontend work. | Versioned API notes in `Utkrisht.md`, CORS/authorization verified, return evidence saved, comparison persisted/retrievable, and a tested error contract. |

## Sequencing

1. **Utkrisht** publishes evidence-listing and comparison-read contracts before those screens consume them.
2. **Abdul** builds the real inspection workflow and dashboard in parallel because create/get/list already exist.
3. **Shreyash** completes capture and evidence upload against the published evidence contract.
4. **Saahya** completes acknowledgement and lock once the review screen can surface inspection state.
5. **Utkrisht** runs the single agreed Bedrock comparison verification only after baseline and return evidence exist.
6. The team integrates comparison results and reports after the retrieval contract is stable.

## Shared contracts and boundaries

Keep these current contracts stable unless the owner and Utkrisht agree on a versioned change:

```ts
type Role = 'owner' | 'renter'
type AssetType = 'scooter' | 'bike' | 'apartment' | 'house'
type InspectionType = 'move-in' | 'move-out' | 'handover'
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

## Handover checklist

- [ ] Scope stayed within the assigned branch and files.
- [ ] UI follows `DESIGN.md` and works at 375px and 390px.
- [ ] Mock behavior still works where the feature has a mock adapter.
- [ ] Real-mode requests use the authenticated facade and display backend errors plainly.
- [ ] Loading, empty, validation, permission, and recovery states are covered.
- [ ] Build and lint pass.
- [ ] The owner’s handover note documents test steps, API assumptions, and blockers.
