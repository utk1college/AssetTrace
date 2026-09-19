# Saahya handover — verification lock

## Completed

- Implemented evidence review with area progress, checklist capture status, evidence counts, and verification-warning messaging.
- Implemented current-user acknowledgement with the exact action `I confirm this inspection`.
- Implemented separate `You` and `Other party` acknowledgement states.
- Disabled baseline locking until both server-derived acknowledgements exist.
- Implemented authoritative locked-state handling using `status: "locked"` and `lockedAt`.
- Added real and mock acknowledgement/lock service methods and Zustand store actions.
- Added loading, recoverable error, and locked-state screens.

## Files changed

- `src/pages/InspectionReviewPage.tsx`
- `src/pages/JointVerificationPage.tsx`
- `src/pages/BaselineLockedPage.tsx`
- `src/components/evidence/EvidenceCard.tsx`
- `src/components/evidence/VerificationStatus.tsx`
- `src/components/verification/PartyStatus.tsx`
- `src/services/inspectionService.ts`
- `src/services/real/inspectionReal.ts`
- `src/services/mock/inspectionMock.ts`
- `src/store/inspectionStore.ts`

## API assumptions

- `POST /inspections/{id}/acknowledge` and `POST /inspections/{id}/lock` accept an authenticated request with an empty JSON body.
- Inspection responses include `acknowledgements?: Record<string, string>` and optional `lockedAt`.
- The backend derives the acknowledging party from the authenticated token and permits either role to call `/lock` after both parties acknowledge.

## Manual test path

1. Run in mock mode and sign in as an owner.
2. Create an inspection and open its review screen.
3. Confirm the area checklist and progress state; no fake thumbnails should appear.
4. Open joint verification and confirm the current user only.
5. Verify the lock action remains disabled while the other party is waiting.
6. Join the inspection as the other party, confirm, then verify both users can lock.
7. Open the locked screen and verify the lock timestamp and read-only explanation.

## Remaining limitation

Server-backed evidence thumbnails and evidence details remain intentionally deferred until the evidence-listing contract is available.
