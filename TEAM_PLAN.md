# AssetTrace implementation plan

**Updated:** September 20, 2026
**UI authority:** [DESIGN.md](DESIGN.md) is the single source of truth for every product interface.
**Current integration mode:** Real mode is available at the deployed API; mock mode remains useful for isolated UI work.

Read [README.md](README.md) first for the product flow and environment setup, then read `DESIGN.md` before changing any page or component.

## Current status — integrated

The following foundation work is complete and is no longer active feature work:

- Cognito registration, email confirmation, login, sign-out, protected routes, and real-session restoration.
- Real and mock authentication adapters selected by `VITE_USE_MOCK`.
- Inspection create, get, list, join, session-code, and local mock support.
- Deployed API Gateway/Lambda, Cognito JWT authorizer, DynamoDB tables, S3 presigned-upload route, acknowledgement, baseline lock, and Bedrock comparison route.
- Browser integration for real-mode authentication and inspection creation/joining.
- Session-code compatibility for both legacy hexadecimal codes and new unambiguous codes.
- Account registration no longer assigns a permanent Owner or Renter role.
- Session creation assigns the creator as Owner or Renter; joining assigns the opposite participant role.
- Dashboard participation is derived from each inspection session, not account metadata.
- Owner-defined capture-point titles are stored with stable IDs and reused for renter return capture.
- Owner-only baseline uploads, renter-only return uploads, two-party acknowledgement, and baseline locking are enforced in mock mode and the deployed backend.
- Evidence listing returns signed image-view URLs for participant review.
- Comparison and report screens use persisted evidence and comparison results; no fabricated dashboard reports remain.
- Comparison accepts up to 20 images per side, covering larger apartment inspections.
- The deployed backend supports evidence listing and latest-comparison retrieval.

The known verified deployment is:

```text
VITE_USE_MOCK=false
VITE_API_ENDPOINT=https://5v3g0fkokj.execute-api.us-east-1.amazonaws.com/prod
```

The delivered product flow is:

```text
Capture → Verify → Acknowledge → Lock → Return → Compare → Report
```

The browser-level workflow still needs final team acceptance at 375px and 390px. Bedrock has produced and persisted a successful comparison result; unclear images correctly return `Uncertain`. The deployed model configuration and comparison path are left unchanged.

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

## Completed ownership areas

| Area | Delivered result | Status |
|---|---|---|---|---|
| Inspection workflow | Live dashboard, workflow, progress, checklist, and status navigation | Complete |
| Evidence capture | Camera-only baseline/return capture, hashing, location, presigned upload, retry states | Complete |
| Verification and lock | Photo review, acknowledgement, lock gating, immutable baseline behavior | Complete |
| Backend contracts | Auth, inspection, evidence, signed image reads, comparison reads, and report data | Deployed |
| Comparison | Bedrock comparison and persisted structured result | Working; browser acceptance pending |
| Session roles | Standard accounts with per-session Owner/Renter participation | Deployed |

## Operational notes

- Main branch is synchronized with origin after the latest integration commit.
- The deployed API is `https://5v3g0fkokj.execute-api.us-east-1.amazonaws.com/prod`.
- `VITE_USE_MOCK=false` is the current local integration setting.
- Do not invoke Bedrock casually; it is a paid operation. Use a controlled test with clear baseline and return evidence.
- Existing local `backend/s3-cors.json` changes are intentionally preserved separately from the application commits.

## Shared contracts and boundaries

Keep these current contracts stable unless the owner and Utkrisht agree on a versioned change:

```ts
type SessionRole = 'owner' | 'renter'
type AssetType = 'scooter' | 'bike' | 'apartment' | 'house'
type InspectionType = 'move-in' | 'move-out' | 'handover'
type InspectionStatus = 'in-progress' | 'awaiting-confirmation' | 'locked'

interface User {
  id: string
  name: string
  email: string
}

interface Inspection {
  id: string
  sessionCode: string
  assetType: AssetType
  assetName: string
  inspectionType: InspectionType
  status: InspectionStatus
  ownerId?: string
  renterId?: string
  sessionRole: SessionRole
  areas: string[]
  capturePoints: { id: string; title: string; order: number }[]
  completedAreaIds: string[]
  createdAt: string
}

interface EvidenceMetadata {
  evidenceId: string
  inspectionId: string
  areaId: string
  capturePointId?: string
  capturePointTitle?: string
  phase: 'baseline' | 'return'
  capturedAt: string
  location?: { latitude: number; longitude: number; accuracy: number }
  sha256: string
  suspicious: boolean
}
```

## Final handoff checklist

- [x] Feature branches integrated and removed after merge.
- [x] UI follows `DESIGN.md` and source build passes.
- [x] Mock and real service adapters are maintained.
- [x] Loading, empty, validation, permission, and recovery states are covered.
- [x] Frontend build, lint, backend syntax, SAM validation, and SAM build pass.
- [x] AWS stack deployed successfully with `UPDATE_COMPLETE`.
- [ ] Team completes browser-level acceptance at 375px and 390px.
