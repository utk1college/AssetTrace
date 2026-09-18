# AssetTrace backend handover

**Project:** AssetTrace  
**Hackathon:** First Commit | Bharat Builds Tour — WeMakeDevs × AWS  
**Team:** Pandoras Box (N9ASHJ)  
**Checkpoint:** September 18, 2026 backend/AWS implementation session

## Current status

The backend is deployed to AWS and the core inspection workflow has been experimentally verified against the live environment.

The remaining backend verification is the real image-comparison path:

```text
return evidence → S3 → /compare → Lambda → Bedrock → structured result → DynamoDB
```

Do not describe AI comparison as verified until `/compare` has successfully run against real baseline and return images.

## Deployed environment

API base URL:

```text
https://5v3g0fkokj.execute-api.us-east-1.amazonaws.com/prod
```

AWS resources:

- CloudFormation stack: `assettrace`
- Lambda: `assettrace-AssetTraceFunction-7986NQhMyEfO`
- CloudWatch log group: `/aws/lambda/assettrace-AssetTraceFunction-7986NQhMyEfO`
- S3 bucket: `assettrace-evidence-650687536843`
- DynamoDB tables: `AssetTrace-Inspections`, `AssetTrace-Evidence`, `AssetTrace-Comparisons`
- Region: `us-east-1`

SAM validation, linting, build, deployment, and a subsequent stack update completed successfully. The installed SAM CLI did not support `sam build --clean`; the normal build command was used instead.

## Authentication

Cognito user pool:

```text
us-east-1_Rmddod48y
```

App client:

```text
5o2c4idi7i55kfangcld9fmtui
```

Public routes:

| Method | Route | Status |
|---|---|---|
| POST | `/auth/register` | Verified |
| POST | `/auth/confirm` | Verified |
| POST | `/auth/login` | Verified |

Protected routes require:

```http
Authorization: Bearer <Cognito access token>
Content-Type: application/json
```

Registration returns `userConfirmed`. The frontend must show the confirmation step when this is `false`.

Registration body:

```json
{"email":"renter@example.com","password":"...","name":"Renter","role":"renter"}
```

Confirmation body:

```json
{"email":"renter@example.com","confirmationCode":"123456"}
```

Login body:

```json
{"email":"renter@example.com","password":"..."}
```

Invalid or nonexistent users return a controlled `INVALID_CREDENTIALS` error instead of a generic 500.

## Verified API routes

| Method | Route | Purpose | Status |
|---|---|---|---|
| POST | `/inspections` | Create an inspection | Verified |
| GET | `/inspections` | List the authenticated owner’s inspections | Verified |
| GET | `/inspections/{id}` | Read an inspection visible to the caller | Verified |
| POST | `/inspections/{id}/join` | Join by session code | Verified |
| POST | `/inspections/{id}/evidence/upload-url` | Create a short-lived S3 upload URL | Verified |
| POST | `/inspections/{id}/evidence` | Save evidence metadata after upload | Verified |
| POST | `/inspections/{id}/acknowledge` | Record a party acknowledgement | Verified |
| POST | `/inspections/{id}/lock` | Lock after both parties acknowledge | Verified |
| POST | `/inspections/{id}/compare` | Run before/after AI comparison | Pending live verification |

## Verified inspection flow

A real inspection was created with:

```text
inspectionId: 39ab8e58-00a8-46a2-b70f-f95696d14551
sessionCode: 5EE3EA
assetType: bike
assetName: Test Bike
inspectionType: handover
areas: front, left, right, rear
status: in-progress
```

Verified behaviors:

- The owner cannot join their own inspection.
- A separate renter account can register, confirm, log in, join with the session code, and retrieve the inspection.
- Both parties can acknowledge the baseline.
- The baseline can then be locked.
- A baseline upload request after locking returns `INSPECTION_LOCKED`.
- Return-phase upload URLs remain available after baseline locking.

## Evidence and storage contract

S3 keys are scoped as:

```text
inspections/<inspectionId>/<evidenceId>
```

The evidence upload flow is:

1. Request `/evidence/upload-url` with `areaId`, `contentType`, and optional `phase`.
2. Upload bytes directly to S3 using the returned presigned PUT URL.
3. Preserve the returned `Content-Type` header.
4. Save metadata through `/evidence`.

Evidence metadata includes:

```json
{
  "evidenceId":"...",
  "areaId":"front",
  "phase":"baseline",
  "key":"inspections/<inspection-id>/<evidence-id>",
  "sha256":"<hex>",
  "capturedAt":"2026-09-18T15:30:00Z",
  "location":{"latitude":12.9,"longitude":77.6,"accuracy":12},
  "suspicious":false
}
```

The real test image was `E:\Projects\weMakeDevs\test.jpg` with SHA-256:

```text
760bfb762bcef621062a1e8f0a53636422a2b1f302b383c87b861b80ce818973
```

The backend validates supported image types, inspection-scoped S3 keys, S3 object existence/type, valid phases, conditional evidence writes, and locked-baseline immutability. Evidence remains tamper-evident/verifiable; the product does not claim impossible-to-fake evidence or legal admissibility.

## DynamoDB contract

- `AssetTrace-Inspections`: partition key `inspectionId`, sort key `sk`; inspection metadata is stored under `META#<inspectionId>`.
- `AssetTrace-Evidence`: evidence records are scoped to the inspection and evidence identifier.
- `AssetTrace-Comparisons`: comparison records use `inspectionId` as the partition key and `sk` as the sort key, with comparison keys in the `CMP#<comparisonId>` form.

The current implementation still uses scans for owner and session-code lookup because production GSI names have not been verified. This is acceptable for the MVP test environment but should be replaced with indexed queries before production-scale traffic.

## Bedrock comparison status

The deployed comparison design uses Amazon Nova 2 Lite (`amazon.nova-2-lite-v1:0`) through `ConverseCommand`.

The intended flow is:

1. Retrieve baseline and return images from S3.
2. Send the actual image bytes as multimodal Bedrock input.
3. Ask Bedrock to identify visible changes by area.
4. Classify each result as `Existing`, `New`, `Uncertain`, or `No visible change`.
5. Return confidence and explanation fields.
6. Validate and persist the structured result in `AssetTrace-Comparisons`.

The live `/compare` inference call, comparison persistence/retrieval, and changed-versus-unchanged image tests are still pending. Do not mark them complete until tested with real S3 evidence.

## Verification checklist

| Component / flow | Status |
|---|---|
| Cognito registration | Verified |
| Email confirmation | Verified |
| Cognito login | Verified |
| JWT authorization | Verified |
| Invalid-login handling | Verified |
| Create inspection | Verified |
| Owner cannot join own inspection | Verified |
| Second-user join | Verified |
| Get inspection | Verified |
| Baseline upload URL | Verified |
| Actual S3 image upload | Verified |
| Save evidence metadata | Verified |
| SHA-256 evidence hash | Verified |
| Two-party acknowledgement | Verified |
| Baseline lock | Verified |
| Baseline immutability | Verified |
| Return upload URL | Verified |
| Return evidence save | Remaining |
| Bedrock `/compare` inference | Remaining |
| Comparison persistence/retrieval | Remaining |
| Full frontend → AWS flow | Remaining |

## Next testing phase

1. Complete one return evidence upload and metadata save.
2. Run `/compare` with real baseline and return evidence references.
3. Verify the Nova 2 Lite response and comparison item in DynamoDB.
4. Test changed-image and unchanged-image pairs.
5. Test invalid and missing comparison inputs.
6. Test the complete frontend flow with `VITE_USE_MOCK=false`.
7. Verify the report/dashboard renders the real API response.

## Frontend handoff

Once the remaining live comparison checks pass, set the deployed API URL in `.env.local`:

```text
VITE_USE_MOCK=false
VITE_API_ENDPOINT=https://5v3g0fkokj.execute-api.us-east-1.amazonaws.com/prod
```

Until the full browser flow is tested, frontend development should continue in mock mode. The frontend must account for email confirmation, carry the evidence `phase`, and treat AI results as reviewable observations rather than legal conclusions.
