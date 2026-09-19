# Saahya handover — verification lock

**Owner:** Saahya
**Branch:** `feat/verification-lock`
**Project:** AssetTrace
**Handover date:** September 19, 2026

## Context for the next AI or teammate

Before changing this work, read these files in order:

1. `README.md`
2. `DESIGN.md`
3. `TEAM_PLAN.md`
4. `Utkrisht.md`
5. This file

Inspect `git status` first. Preserve unrelated work, do not reset or restore other owners’ changes, and stay within the assigned scope unless the team agrees to widen it.

`DESIGN.md` is the UI authority. Keep the experience mobile-first, calm, evidence-first, and practical. Use Lucide icons, sentence case, semantic status text, 48px interactive targets, the defined colour tokens, and loading/empty/recoverable-error states. Do not add emoji icons, gradients, fake evidence, raw hashes/S3 keys in product UI, or unsupported claims about authenticity or legal validity.

## Assignment from `TEAM_PLAN.md`

Saahya owns the review, joint acknowledgement, and baseline-lock flow using authenticated inspection state. The assigned definition of done is:

- Both roles can see review state.
- Acknowledgement is explicit and belongs only to the current user.
- Locking is disabled until both parties acknowledge.
- Either party can lock after both parties acknowledge.
- The locked state is clear.

Dependencies:

- Utkrisht confirms the acknowledgement and lock response shapes.
- Abdul exposes the inspection workflow hand-off into review and verification.
- Shreyash provides captured-area and evidence-upload state from the camera flow.

Other ownership from the team plan:

- Abdul owns the inspection workflow/detail page, dashboard integration, and checklist progress.
- Shreyash owns camera-first capture, geolocation/telemetry, SHA-256, readiness, and evidence upload.
- Utkrisht owns backend read contracts, return-evidence verification, and comparison verification.

## Completed implementation

### Evidence review

`src/pages/InspectionReviewPage.tsx` now provides:

- Captured-area progress and percentage.
- Area checklist with `Evidence recorded` or `Not captured` status.
- Evidence count.
- Verification-status panel.
- Loading and recoverable error states.
- Navigation to joint verification and back to the inspection.
- No fake thumbnails or inferred evidence.

The current review uses `inspection.completedAreaIds` because the evidence-listing contract is not yet available. Server-backed evidence thumbnails and evidence details must be added later behind this same review screen after Utkrisht publishes that contract.

### Joint verification and acknowledgement

`src/pages/JointVerificationPage.tsx` now provides:

- One action for the signed-in user:

  ```text
  I confirm this inspection
  ```

- Separate status for:

  ```text
  You: Confirmed / Waiting
  Other party: Confirmed / Waiting
  ```

- A user cannot represent or submit acknowledgement for the other party.
- Acknowledgement timestamps are displayed when available.
- Locking is disabled until both acknowledgements exist.
- Either owner or renter can lock after both acknowledgements exist.
- Backend errors are shown in a recoverable alert state.

The UI derives acknowledgement state as required:

```ts
const ownerAcknowledged = Boolean(
  inspection.acknowledgements?.[inspection.ownerId],
)

const renterAcknowledged = Boolean(
  inspection.renterId &&
  inspection.acknowledgements?.[inspection.renterId],
)

const bothAcknowledged = ownerAcknowledged && renterAcknowledged
```

### Locked baseline

`src/pages/BaselineLockedPage.tsx` now provides:

- Clear `Baseline locked` status.
- The authoritative `lockedAt` timestamp.
- Read-only explanation.
- Navigation to return inspection and the inspection detail.

The lock response is treated as authoritative only when it returns `status: "locked"` and `lockedAt`.

### Service and store boundary

Added acknowledgement and lock methods to:

- `src/services/inspectionService.ts`
- `src/services/real/inspectionReal.ts`
- `src/services/mock/inspectionMock.ts`
- `src/store/inspectionStore.ts`

The inspection type now supports:

```ts
acknowledgements?: Record<string, string>
lockedAt?: string
```

The real adapter calls:

```text
POST /inspections/{id}/acknowledge
POST /inspections/{id}/lock
```

The current implementation assumes these authenticated endpoints accept an empty JSON body and return the updated inspection object. Confirm this request/response shape with Utkrisht before relying on real-mode behavior.

### Reusable components

Updated:

- `src/components/evidence/EvidenceCard.tsx`
- `src/components/evidence/VerificationStatus.tsx`
- `src/components/verification/PartyStatus.tsx`

### Handover notes

`S.md` was also added as a shorter implementation handover. This `Saahya.md` is the complete context document for future agents and teammates.

## Known limitations and waiting items

### 1. Abdul’s workflow hand-off is pending

`src/pages/InspectionWorkflowPage.tsx` is still a placeholder. Abdul’s scope is to make a created or joined inspection open a usable workflow screen and connect it to review.

When Abdul finishes, the expected flow is:

```text
inspection workflow → capture → review → joint verification → locked
```

Coordinate before changing shared routing or workflow contracts.

### 2. Shreyash’s capture flow is pending

`src/pages/CaptureScreen.tsx` is still a placeholder. Until the camera/evidence work is complete:

- `completedAreaIds` may remain empty.
- Review progress may show `0 of N`.
- The review-to-verification action may remain disabled.
- Real capture/upload status is not available.

Do not fabricate thumbnails, hashes, evidence records, or verification results to make the review screen appear complete.

### 3. Utkrisht’s evidence-listing contract is pending

The review screen currently cannot show server-backed thumbnails or evidence metadata. Wait for the versioned evidence-listing contract before adding:

- Real thumbnails.
- Capture timestamps.
- Location/telemetry details.
- SHA-256 or evidence-integrity details in an appropriate product-safe presentation.
- Suspicious-capture warnings.

Evidence metadata from `Utkrisht.md` includes `evidenceId`, `areaId`, `phase`, `key`, `sha256`, `capturedAt`, `location`, and `suspicious`. Do not expose raw S3 keys or hashes in ordinary product screens.

### 4. Verification warning wording needs a final evidence-backed state

The current review screen uses a placeholder no-warning state because evidence verification data is unavailable. Once evidence metadata is available, replace it with real warning states such as `Evidence recorded`, `Location recorded`, or `Possible capture issue`. Until then, avoid implying that evidence has been fully verified.

### 5. Area identifier mapping must be confirmed

The review currently compares `completedAreaIds` with the values in `inspection.areas`. The evidence contract uses `areaId`. Confirm with Abdul and Utkrisht whether these are stable IDs or display labels before changing the comparison logic.

### 6. Real-mode frontend integration is not yet live-tested

The deployed API is documented as:

```text
VITE_USE_MOCK=false
VITE_API_ENDPOINT=https://5v3g0fkokj.execute-api.us-east-1.amazonaws.com/prod
```

The backend routes for acknowledgement and lock are documented as verified, but the complete browser path from frontend review through acknowledgement and lock still needs a controlled real-mode test. Do not claim the complete frontend-to-AWS flow is verified until that test succeeds.

## Important route and identifier note

The review, verification, and locked routes require the inspection ID, not the six-character session code:

```text
/inspections/<inspection-id>/review
/inspections/<inspection-id>/verify
/inspections/<inspection-id>/locked
```

Do not use:

```text
/inspections/ABC123/verify
```

unless `ABC123` is actually the inspection ID. The six-character code is for joining; using it as the route ID causes `Inspection not found`.

## How to continue after dependencies arrive

### After Abdul finishes

1. Read Abdul’s handover note.
2. Inspect `git status` and preserve both branches’ unrelated changes.
3. Confirm the workflow navigates to `/inspections/:id/review` with the actual inspection ID.
4. Confirm the workflow passes refreshed inspection state into the review screen.
5. Test created and joined inspections in both owner and renter roles.
6. Do not duplicate workflow logic inside the verification pages.

### After Shreyash finishes

1. Confirm capture updates `completedAreaIds` correctly.
2. Confirm upload failures preserve unsaved capture locally, as required by `DESIGN.md`.
3. Confirm baseline evidence carries `phase: "baseline"`.
4. Confirm return evidence carries `phase: "return"`.
5. Test review progress against real captured areas.
6. Replace placeholder verification messaging only when actual verification data is available.

### After Utkrisht publishes the evidence contract

1. Read the updated `Utkrisht.md` contract.
2. Coordinate before changing shared types or the service facade.
3. Add an evidence-listing method through the facade, not by importing a concrete adapter into a page.
4. Load evidence for the current inspection and map it by stable `areaId`.
5. Add real thumbnails and metadata to `InspectionReviewPage`.
6. Add loading, empty, permission-denied, and recoverable-error states.
7. Keep evidence warnings factual and reviewable; do not claim authenticity guarantees.

### Before final handoff

1. Test mock mode with two separate accounts.
2. Confirm one party cannot submit the other party’s acknowledgement.
3. Confirm lock remains disabled until both acknowledgements are present.
4. Confirm either role can lock after both acknowledgements.
5. Confirm a locked baseline cannot be edited or re-acknowledged.
6. Test at 375px, 390px, and desktop width with no horizontal scroll.
7. Run:

   ```powershell
   npm run build
   npm run lint
   git diff --check
   ```

8. Record exact manual test steps and any API assumptions in the next handover note.

## Mock-mode test procedure

Use mock mode for isolated testing:

```env
VITE_USE_MOCK=true
```

1. Sign in as an owner.
2. Create an inspection.
3. Record the inspection UUID and six-character join code separately.
4. Sign in as a separate renter account.
5. Join with the six-character code.
6. Open `/inspections/<inspection-id>/verify`.
7. Confirm the current user.
8. Verify the other party remains `Waiting` and lock is disabled.
9. Switch to the other account and confirm.
10. Verify both statuses are `Confirmed`.
11. Lock from either account.
12. Verify `/locked` displays the timestamp and read-only state.

The current capture page and workflow page are placeholders, so direct route testing may be needed until Abdul and Shreyash complete their dependencies.

## Real-mode safety

Real mode requires an authenticated browser session and the deployed API endpoint. Never commit `.env.local`, credentials, access tokens, screenshots containing user data, generated SAM output, or AWS secrets. Do not create, deploy, or modify AWS resources without Utkrisht’s explicit approval. Do not invoke Bedrock except through the agreed controlled backend comparison test.

## Pre-commit checklist

- [ ] `Saahya.md` is included in the branch.
- [ ] Existing unrelated `package-lock.json` changes were reviewed before staging.
- [ ] No `.env.local`, credentials, tokens, screenshots, or generated AWS output are staged.
- [ ] Build passes.
- [ ] Lint passes.
- [ ] `git diff --check` passes.
- [ ] Mock/manual verification steps are recorded.
- [ ] PR targets `main` and links this handover note.
