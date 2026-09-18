# AssetTrace

AssetTrace creates a shared, evidence-led condition record when a rental asset changes hands, then compares the move-in baseline with the return condition. The MVP supports scooters, bikes, apartments, and houses.

**Capture → Verify → Acknowledge → Lock → Return → Compare → Report**

## Start here

1. Read [DESIGN.md](DESIGN.md) before changing UI. It is the single visual and interaction source of truth.
2. Read [TEAM_PLAN.md](TEAM_PLAN.md) for ownership, branch rules, API contracts, and handover criteria.
3. Develop in mock mode unless the team lead explicitly says that the real API is deployed and gives you its URL.

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

Open a pull request against `main`. Include the relevant handover note (`A.md`, `S.md`, or `Sh.md`) and explain how the feature was tested. Never commit `.env.local`, AWS credentials, or secrets.

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
| Real | `false` | Only after the API Gateway URL and backend contract are supplied | Cognito, API Gateway, and presigned S3 upload URLs |

Do not switch to real mode merely because Cognito, DynamoDB, or S3 exists. Real mode requires deployed Lambda/API endpoints, S3 CORS, and a tested browser integration.

`.env.example` contains the shared non-secret identifiers. Never commit credentials, local access keys, or a populated `.env.local`.

## Product and technical scope

### Planned MVP features

The two-day MVP is planned as these decoupled product capabilities. A feature being listed here is a target, not a claim that it is already implemented; see the current-status section at the end of this README.

| Capability | Planned outcome |
|---|---|
| Authentication | Owner and renter accounts, role-aware access, and protected inspection sessions |
| Inspection sessions | Create move-in/move-out inspections, use area checklists, and let a second party join by QR or session code |
| Guided evidence capture | Live camera-only capture with a step-by-step asset workflow, timestamps, location, and available device telemetry |
| Capture verification | Flag suspicious capture signals such as screen recapture, failed movement challenge, or missing continuity; never claim proof of authenticity |
| Evidence integrity | SHA-256 media hashes, inspection-level integrity metadata, acknowledgement records, and an immutable locked baseline |
| Joint verification | Both parties review, acknowledge, and lock a condition baseline together |
| Secure storage | Preserve original evidence and inspection metadata, separating move-in and return records |
| Return inspection | Repeat the same guided inspection flow at return |
| AI comparison | Compare before/after evidence, localise visible changes, classify likely damage, and clearly surface uncertain results for review |
| Condition reports | Present existing versus newly observed damage, evidence, verification metadata, and a downloadable/shareable report |

Supported MVP asset types are rental properties, bikes, and scooters. Cars and other asset types are future extensions.

### User flow

1. Owner creates a move-in or move-out inspection.
2. The other party joins with a six-character code or QR code.
3. Both parties complete guided, live camera evidence capture.
4. The app records capture time, location, orientation/telemetry, and a SHA-256 digest.
5. Both parties review and acknowledge the evidence; the baseline is then locked.
6. A return inspection repeats the capture flow.
7. The system compares baseline and return evidence and produces a condition report.

The app may flag suspicious evidence or uncertain image changes. It must not claim a guarantee of authenticity, legal validity, or perfect spoof prevention.

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
├── services/    # Mock and real service adapters (to be added by feature owners)
├── store/       # Zustand stores (to be added by feature owners)
├── hooks/       # Browser integration hooks
├── utils/       # Shared helpers
└── config/      # Client configuration
```

## AWS architecture and safety

The frontend never receives AWS credentials. It authenticates through Cognito and uses the API for application data. For uploads, the API issues a short-lived presigned S3 URL; the browser then uploads directly to S3.

Keep development in mock mode by default. Never create, deploy, or modify AWS resources that could incur charges without the team lead’s explicit approval. Bedrock calls are especially billable and should be invoked only through a controlled backend endpoint.

## UI and quality bar

Follow `DESIGN.md` exactly. The experience is mobile-first, calm, evidence-first, and practical.

- Test at 375px and 390px before review; there must be no horizontal scroll.
- All interactive controls need at least a 48px target.
- Use Lucide—not emoji—for product iconography.
- Use semantic status colour and text; brand colour is only for primary actions and selected navigation.
- Build loading, empty, error, and permission-denied states for asynchronous screens.
- Preserve existing pages and components outside your assigned scope.

## Current project status — September 18, 2026

The frontend shell, routes, shared UI components, and redesigned mobile dashboard are present and the production build/lint pass. The project is ready for the three feature owners to implement and test their assigned flows in **mock mode**.

AWS in `us-east-1` has been verified: the Cognito user pool and app client, three DynamoDB tables, S3 evidence bucket, IAM developer group, and three teammate IAM users exist. No Lambda functions, API Gateway APIs, or S3 CORS configuration exist yet. Consequently, there is **no real API to integrate with** and `VITE_USE_MOCK=false` is not usable yet. The team lead must complete the backend deployment and publish the API contract before the real-mode integration phase.
