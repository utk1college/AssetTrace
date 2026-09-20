The hosted build uses real mode. Open it on a phone over HTTPS to test camera, video, and geolocation permissions. The frontend is hosted by Amplify Hosting; the API uses Cognito, API Gateway, Lambda, DynamoDB, S3, and Bedrock.

### Real mobile end-to-end test

Use two phones if possible. A single phone can switch accounts, but two phones make the Owner/Renter handoff easier to observe. Both phones need internet access; they do not need to share Wi-Fi because the demo is hosted over HTTPS.
1. Open the hosted URL on both phones: `https://assettrace.d2re85crrtyc3z.amplifyapp.com`.
2. Create two separate Cognito accounts from **Create an account**. Use two real email inboxes because Cognito sends a confirmation code. Use a password with 8+ characters, uppercase, lowercase, number, and symbol.
3. Sign in as the first user on Phone A. Choose **New inspection**, select **Wall**, name it something like `Living room wall`, choose **Owner**, and keep the default wall capture points or rename them to the exact surface sections you will test.
4. Share the six-character session code shown after creation with the second user.
5. On Phone A, open the inspection and choose **Record baseline condition**. Allow camera and location permissions. Capture every wall section, then record the guided context video by slowly scanning the full wall from left to right, including edges and visible marks. Stop the video or let the 15-second limit stop it, then continue to baseline review.
6. On Phone B, sign in as the second user, choose **Join**, enter the six-character code, open the inspection, and review the baseline photos. The second user should acknowledge the baseline from the verification screen.
7. On Phone A, acknowledge the same baseline. Once both acknowledgements appear, lock the baseline. Confirm the UI shows that the baseline is read-only.
8. Before return capture, place a clearly visible object or mark on the wall without changing the baseline. On Phone B, open the locked inspection and choose **Record return condition**. Capture the same wall sections and record a second guided context video showing the changed wall.
9. On Phone A, open the return review, confirm the return evidence is present, then open **Compare evidence**. The owner runs the comparison. This is the step that invokes Bedrock and may incur a charge.
10. Open the **Condition report**. Confirm it contains before and after photos, both playable context videos, phase, timestamp, GPS availability, SHA-256, capturer, acknowledgement count, baseline lock time, comparison status, confidence, and explanation.
11. Open **Reports** from the bottom navigation and confirm the inspection is listed. After all return photos and the return context video are saved, the transaction should show as frozen and further return uploads should be blocked.

For a clean repeat, use a new inspection and different account pair. Do not use the same baseline after locking; locked evidence is intentionally immutable.
# AssetTrace

AssetTrace creates a shared, evidence-led condition record when a rental asset changes hands, then compares the move-in baseline with the return condition. The MVP supports scooters, bikes, apartments, houses, and walls/surfaces.

**Capture → Verify → Acknowledge → Lock → Return → Compare → Report**

## Start here

1. Use mock mode for isolated UI work and local development.
2. Use the hosted demo for phone testing and real integration checks.
3. Keep this README as the source of truth for product behavior, design rules, deployment details, and limitations.

## Run locally

Requirements: Node.js 18 or later and npm.

### Teammate setup

Clone the repository, create a feature branch, and install dependencies:

```powershell
git clone https://github.com/utk1college/AssetTrace.git
cd AssetTrace
git switch -c feat/your-feature-name
npm install
Copy-Item .env.example .env.local
```

Leave `VITE_USE_MOCK=true` in `.env.local`. This is the safe default and does not call AWS. Start the frontend with `npm run dev`, then open the Vite URL and `/dashboard`.

Before pushing a branch:

```powershell
npm run build
npm run lint
git add .
git commit -m "Describe the feature"
git push -u origin feat/your-feature-name
```

Open a pull request against `main`. Explain how the feature was tested. Never commit `.env.local`, AWS credentials, or secrets.

After setup, run:

```powershell
npm run dev
```

Open the local URL printed by Vite, then visit `/dashboard`. Before opening a pull request, run:

```powershell
npm run build
npm run lint
```

## Development modes

The project has two intended service modes, selected by `VITE_USE_MOCK`.

| Mode | `VITE_USE_MOCK` | When to use it | AWS calls |
|---|---:|---|---|
| Mock | `true` | Default for all feature work and UI testing | None |
| Real | `false` | Authenticated browser integration with the deployed API | Cognito, API Gateway, and presigned S3 upload URLs |

Real mode requires the deployed API URL and a confirmed browser session. The checked-in `.env.example` contains the non-secret deployed endpoint; `.env.local` remains local-only.

`.env.example` contains the shared non-secret identifiers. Never commit credentials, local access keys, or a populated `.env.local`.

## Hosted demo

The current AWS-hosted frontend is available at:

```text
https://assettrace.d2re85crrtyc3z.amplifyapp.com
```

The deployed API is:

```text
https://5v3g0fkokj.execute-api.us-east-1.amazonaws.com/prod
```

The hosted build uses real mode. Open it on a phone over HTTPS to test camera, video, and geolocation permissions. The frontend is hosted by Amplify Hosting; the API uses Cognito, API Gateway, Lambda, DynamoDB, S3, and Bedrock.

### Real mobile end-to-end test

Use two phones if possible. A single phone can switch accounts, but two phones make the Owner/Renter handoff easier to observe. Both phones need internet access; they do not need to share Wi-Fi because the demo is hosted over HTTPS.

1. Open `https://assettrace.d2re85crrtyc3z.amplifyapp.com` on both phones.
2. Create two separate Cognito accounts from **Create an account**. Use two real email inboxes because Cognito sends a confirmation code. Use a password with 8+ characters, uppercase, lowercase, number, and symbol.
3. Sign in as the first user on Phone A. Choose **New inspection**, select **Wall**, name it `Living room wall`, choose **Owner**, and keep or rename the default wall capture points.
4. Share the six-character session code shown after creation with the second user.
5. On Phone A, choose **Record baseline condition**. Allow camera and location permissions. Capture every wall section, then record the guided context video by slowly scanning the full wall from left to right, including edges and visible marks.
6. On Phone B, sign in as the second user, choose **Join**, enter the code, open the inspection, review the baseline photos, and acknowledge the baseline.
7. On Phone A, acknowledge the same baseline. Once both acknowledgements appear, lock the baseline and confirm it is read-only.
8. Place a clearly visible object or mark on the wall without changing the baseline. On Phone B, open the locked inspection, choose **Record return condition**, capture the same wall sections, and record the second guided context video showing the changed wall.
9. On Phone A, open **Compare evidence**. The owner runs the comparison. This invokes Bedrock and may incur a charge.
10. Open **Condition report**. Confirm before/after photos, both playable context videos, phase, timestamp, GPS availability, SHA-256, capturer, acknowledgement count, lock time, comparison status, confidence, and explanation.
11. Open **Reports** from the bottom navigation. After all return photos and the return context video are saved, the transaction should show as frozen and further return uploads should be blocked.

For a clean repeat, use a new inspection and account pair. Do not try to change baseline evidence after locking; immutability is intentional.

## Product and technical scope

### Implemented product features

The following features are implemented in the current frontend and backend. Statuses and limitations are documented below rather than inferred from the product plan.

| Feature | What it does |
|---|---|
| Account registration | Creates an account with name, email, and password. Real mode uses Cognito; mock mode stores test accounts locally. |
| Email confirmation | Real mode supports Cognito confirmation codes and handles unconfirmed accounts during sign-in. Mock mode accepts a non-empty code. |
| Sign-in and session restoration | Logs users in, stores the session through the selected auth adapter, restores the current user on app load, and supports sign-out. |
| Protected navigation | Dashboard, inspections, capture, review, comparison, reports, and profile require authentication. Login and registration are public-only routes. |
| Profile page | Shows the signed-in user’s name and email, with an explicit sign-out action. |
| Inspection creation | Creates a session for a scooter, bike, apartment, house, or wall/surface, with a custom asset name and move-in or move-out type. |
| Role selection | The creator chooses Owner or Renter for the session. The second participant receives the opposite session role when joining. |
| Custom capture points | The creator can edit, add, and remove photo titles. Those stable titles become the required return-capture points. |
| Session sharing | Generates a six-character session code and QR code. The code can be copied and shared with the other participant. |
| Session joining | Validates the six-character code for the active mode, finds the inspection, and prevents a participant from joining their own session. |
| Inspection dashboard | Lists inspections visible to the signed-in user, shows asset type, participant role, progress, session stage, and lock/frozen status. |
| Persistent mobile navigation | Provides Home, New inspection, Join, and Reports destinations throughout authenticated screens. |
| Camera capture | Requests the device camera, prefers the rear-facing camera, displays a live preview, captures JPEG evidence, and supports camera-permission retry. |
| Guided context video | Captures one short, phase-specific video after the photo sequence at handover/baseline and return. Directions are asset-aware: bikes scan sides and frame; walls scan the full surface and edges; properties scan relevant rooms/surfaces. Videos are stored with duration, timestamp, phase, GPS availability, SHA-256, and capturer identity. Video is not sent to Bedrock. |
| Evidence metadata | Records capture time, optional geolocation, SHA-256 media digest, phase, capture point, content type, and suspicious flag. Current capture flow sets `suspicious` to `false`. |
| Evidence upload | Real mode requests a short-lived presigned S3 URL, uploads the image directly to S3, then saves metadata through the API. Mock mode uses local object URLs and local storage. |
| Capture retry | Keeps a failed capture in the current screen and offers a retry for the metadata/upload operation. |
| Baseline review | Participants can review signed image URLs for baseline evidence and see capture progress. The renter has a placeholder objection action that currently displays an alert and does not create a backend objection record. |
| Joint acknowledgement | Each participant records an acknowledgement. The baseline cannot be locked until all required baseline areas are captured and both parties acknowledge. |
| Baseline lock | Locks the baseline and prevents further baseline evidence changes. The lock timestamp and acknowledgement records are persisted. |
| Return inspection | After baseline lock, only the renter can capture return evidence. The owner can review submitted return evidence. |
| Return transaction freeze | When all configured return capture points are saved, the inspection records `returnCompletedAt` and rejects further return evidence uploads. The UI presents the transaction as complete and read-only. |
| Evidence comparison | Mock mode produces a deterministic review result. Real mode sends baseline and return image bytes to Amazon Nova 2 Lite through Bedrock. |
| Comparison classifications | Results can be `Existing`, `New`, `Uncertain`, or `No visible change`, with confidence and an explanation for each capture point. |
| Comparison detail | Users can open an individual comparison result for its explanation and confidence. Results are explicitly presented as observations for human review. |
| Reports index | Lists locked inspections and indicates whether return evidence is pending or the transaction is frozen. |
| Condition report | Shows inspection status, evidence count, comparison availability, and observed comparison results. It links back to the comparison screen. |
| Report integrity trail | Shows before/after photos, playable baseline and return context videos, capture phase, timestamp, GPS availability, SHA-256, capturer, acknowledgement count, lock timestamp, and the engineering controls used to preserve the evidence trail. |
| Toast feedback | Shows transient success or error feedback for copying a session code, acknowledging, and locking a baseline. |
| Loading, empty, and error states | Asynchronous screens provide loading indicators, empty states, retry actions, permission messages, and recoverable error messages where implemented. |

Supported asset types are scooters, bikes, apartments, houses, and walls/surfaces. Cars and other asset types are not currently supported.

### Current user flow

1. Register and confirm an account, then sign in.
2. Create an inspection, choose an asset and role, define photo titles, and share the code or QR code.
3. The other participant joins using the six-character code.
4. The owner captures the baseline through the live camera flow. The app hashes the image and records capture metadata before uploading it.
5. Both participants review and acknowledge the baseline.
6. The baseline is locked and becomes read-only.
7. The renter captures the same configured points for the return condition.
8. When all return points and the return context video are complete, the transaction is frozen against further return evidence changes.
9. The owner runs the comparison, reviews the results, and opens the condition report.

The product reports evidence signals and model observations. It does not claim guaranteed authenticity, legal validity, perfect spoof prevention, or automatic legal damage determination.

### Stack

- React, Vite, and TypeScript
- Tailwind CSS v4, Lucide icons, and the shared component/design system
- Zustand for client state
- React Router
- AWS Cognito, API Gateway, Lambda, DynamoDB, S3, Bedrock, and CloudWatch for the deployed path
- Browser APIs: camera, geolocation, device orientation/motion, and Web Crypto

### Repository layout

```text
src/
├── components/  # Reusable UI by domain
├── pages/       # Route-level screens
├── services/    # Facades plus mock and real auth/inspection adapters
├── store/       # Zustand auth and inspection state
├── hooks/       # Browser integration hooks
├── utils/       # Shared helpers
└── config/      # Client configuration
```

## AWS architecture and safety

The frontend never receives AWS credentials. It authenticates through Cognito and uses the API for application data. For uploads, the API issues a short-lived presigned S3 URL; the browser then uploads directly to S3.

Keep development in mock mode by default. Never create, deploy, or modify AWS resources that could incur charges without the team lead’s explicit approval. Bedrock calls are especially billable and should be invoked only through a controlled backend endpoint.

## Design and quality bar

The experience is mobile-first, calm, evidence-first, and practical. Use the following rules when changing the interface:

- Use Inter or the existing system UI fallback, sentence case, and restrained type hierarchy.
- Use the existing tokens: white cards, `#F7F7F8` page surface, `#18181B` primary text, `#686870` supporting text, `#D93858` for primary actions, green for success, amber for waiting/review, and red for errors.
- Use a 4px spacing rhythm, 16px mobile page padding, 640px maximum content width, 12px card radius, and 48px minimum interactive targets.
- Use Lucide icons, never emoji or decorative stock art.
- Keep one clear primary action per screen and reserve space for the persistent bottom navigation and safe area.
- Show evidence before decoration. Do not add fake metrics, decorative charts, gradients, glass effects, neon, or unsupported authenticity/legal claims.
- Use semantic status text in addition to colour. Provide loading, empty, permission-denied, validation, and recoverable-error states for asynchronous work.
- Test at 375px, 390px, and desktop widths with no horizontal scrolling.

## Backend contract

The deployed API is protected by Cognito except for registration, confirmation, and login. The frontend never receives AWS credentials.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Register an account. |
| POST | `/auth/confirm` | Confirm an account with a Cognito code. |
| POST | `/auth/login` | Sign in and receive tokens. |
| POST | `/inspections` | Create an inspection. |
| GET | `/inspections` | List inspections visible to the caller. |
| GET | `/inspections/{id}` | Read an inspection visible to the caller. |
| POST | `/inspections/{id}/join` | Join by session code. |
| POST | `/inspections/{id}/evidence/upload-url` | Request a presigned S3 upload URL for a photo or context video. |
| POST | `/inspections/{id}/evidence` | Persist uploaded evidence metadata. |
| GET | `/inspections/{id}/evidence` | List evidence and signed view URLs. |
| POST | `/inspections/{id}/acknowledge` | Record a participant acknowledgement. |
| POST | `/inspections/{id}/lock` | Lock the baseline after both acknowledgements. |
| POST | `/inspections/{id}/compare` | Run the owner-triggered Bedrock photo comparison. |
| GET | `/inspections/{id}/compare` | Retrieve the latest persisted comparison. |

Service boundaries are deliberate: pages use Zustand stores or the service facade, never concrete mock/real adapters. `VITE_USE_MOCK=true` uses local storage and no AWS calls; `VITE_USE_MOCK=false` uses Cognito, API Gateway, S3, and the deployed backend.

## Current project status — September 20, 2026

The real backend is deployed in `us-east-1`. Cognito registration, email confirmation, login, protected API access, inspection create/join, acknowledgement, baseline lock, S3 presigned uploads, and evidence metadata persistence are available through the deployed API. The frontend is connected in real mode with:

```text
VITE_USE_MOCK=false
VITE_API_ENDPOINT=https://5v3g0fkokj.execute-api.us-east-1.amazonaws.com/prod
```

Completed frontend features include real/mock authentication adapters, session restoration, inspection creation/joining, QR and code sharing, guided camera capture, context video capture, SHA-256 hashing, geolocation capture, signed evidence reads, baseline review, joint acknowledgement, baseline locking, return capture, comparison screens, reports, profile management, persistent navigation, toast feedback, and frozen return transactions.

The backend comparison path has been deployed and verified with real S3 evidence: the Lambda retrieves evidence, invokes Amazon Nova 2 Lite through Bedrock, validates the structured result, persists it in DynamoDB, and exposes the latest comparison to the frontend. Final product acceptance still includes testing the full hosted flow on real phones at 375px and 390px.

### Known limitations

- The UI identifies participants by role and joined state. The current inspection contract does not return the other participant’s display name.
- The objection control in baseline review is a placeholder and does not persist an objection or notify the other party.
- The capture flow records geolocation when permission is available. Device telemetry is collected by the camera component but is not currently persisted in the evidence metadata contract.
- Context videos are stored and playable but are intentionally not analyzed by AI yet. Future video analysis is planned separately.
- Condition reports are viewable in the app but are not currently downloaded or shared as files.
- Owner and session-code lookup currently use DynamoDB scans; indexed queries should replace them before production-scale traffic.
- Bedrock comparison is an explicit owner action and can incur model charges. Treat every result as reviewable output.

## Hackathon release checklist

- `npm install` completes from a clean checkout.
- `npm run build` passes.
- `npm run lint` completes; existing React effect warnings should be reviewed before production hardening.
- `node --check backend/src/handler.mjs` passes.
- The deployed CloudFormation stack is `UPDATE_COMPLETE`.
- The hosted Amplify URL loads over HTTPS, including direct `/reports` and `/profile` routes.
- Mobile acceptance is performed at 375px and 390px using the hosted URL.
- The complete real Owner/Renter flow is tested with two confirmed Cognito accounts before presenting the demo as fully verified.
