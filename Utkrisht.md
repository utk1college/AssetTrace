# AssetTrace backend handover

**Status:** Local backend scaffold and contract prepared; AWS deployment is intentionally pending final schema/configuration review and explicit deployment approval.

## API base

After deployment, publish the generated HTTP API URL here and in `.env.local`:

```text
VITE_API_ENDPOINT=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
```

Until that URL exists, all frontend work stays in mock mode.

## Authentication

`POST /auth/register` and `POST /auth/login` are public routes. All other routes require:

```http
Authorization: Bearer <Cognito access token>
Content-Type: application/json
```

Registration body:

```json
{"email":"renter@example.com","password":"...","name":"Renter","role":"renter"}
```

Login body:

```json
{"email":"renter@example.com","password":"..."}
```

Every error uses this shape:

```json
{"error":{"code":"INVALID_REQUEST","message":"Human-readable explanation"}}
```

## Endpoint contract

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create a Cognito user |
| POST | `/auth/login` | Return Cognito access, ID, and refresh tokens |
| POST | `/inspections` | Create an inspection |
| GET | `/inspections` | List inspections owned by the authenticated user |
| GET | `/inspections/{id}` | Read an inspection visible to the authenticated party |
| POST | `/inspections/{id}/join` | Join by session code |
| POST | `/inspections/{id}/evidence/upload-url` | Create a 10-minute presigned S3 PUT URL |
| POST | `/inspections/{id}/evidence` | Save evidence metadata after upload |
| POST | `/inspections/{id}/acknowledge` | Record the caller’s acknowledgement |
| POST | `/inspections/{id}/lock` | Lock only after both parties acknowledge |
| POST | `/inspections/{id}/compare` | Run the controlled before/after comparison |

Inspection creation body:

```json
{"assetType":"scooter","assetName":"Honda Activa","inspectionType":"move-in","areas":["front","left-side","right-side","rear"]}
```

The response contains `id`, `sessionCode`, `ownerId`, `status`, `areas`, `completedAreaIds`, `createdAt`, and `updatedAt`. Status values are `in-progress`, `awaiting-confirmation`, and `locked`.

Join body:

```json
{"sessionCode":"X8F2K9"}
```

Upload URL body:

```json
{"areaId":"front","contentType":"image/jpeg"}
```

The client must upload the bytes with `PUT` using the returned `uploadUrl`, preserving the returned `Content-Type`, then save metadata:

```json
{"evidenceId":"...","areaId":"front","key":"inspections/<inspection-id>/<evidence-id>","sha256":"<hex>","capturedAt":"2026-09-18T15:30:00Z","location":{"latitude":12.9,"longitude":77.6,"accuracy":12},"suspicious":false}
```

## Storage contract

- Existing DynamoDB tables are `AssetTrace-Inspections`, `AssetTrace-Evidence`, and `AssetTrace-Comparisons` in `us-east-1`.
- The known inspections table key is `inspectionId` (partition) plus `sk` (sort). The scaffold stores the inspection item under `META#<inspectionId>`.
- Evidence items use `inspectionId` and `evidenceId`; comparison items use `inspectionId` and `comparisonId`. Verify these two existing table key schemas with `DescribeTable` before deployment; the local AWS CLI was unavailable during scaffold validation.
- The scaffold uses DynamoDB scans for owner/session lookup because the existing GSI names have not been verified. Add and use GSIs before production-scale traffic.
- S3 keys are scoped as `inspections/<inspectionId>/<evidenceId>`.

## Deployment checklist

Before deploying `backend/template.yaml`:

1. Verify the evidence/comparison table keys and any GSIs.
2. Verify the Cognito app client supports `USER_PASSWORD_AUTH` and the `custom:role` attribute.
3. Restrict `AllowedOrigin` from `*` to the deployed frontend origin.
4. Configure S3 bucket CORS from `backend/s3-cors.json` for the frontend and deployed API workflow.
5. Review the Lambda execution policy, especially Bedrock access and S3 prefix restrictions.
6. Confirm the Bedrock model is enabled in `us-east-1`.
7. Obtain explicit approval before `sam deploy` or any AWS mutation.

## Local validation

```powershell
cd backend
npm install
npm run check
```

The backend is not considered real-mode ready until the API is deployed, the API URL is added to `.env.local`, the S3 CORS configuration is applied, and the full browser flow passes with `VITE_USE_MOCK=false`.

## Known limitations

- The comparison route sends evidence references to Bedrock and stores the model response; it needs a reviewed prompt/output schema before demo use.
- Registration may require Cognito email confirmation depending on the user-pool configuration.
- Scan-based lookups are a safe scaffold, not a production indexing strategy.
- Evidence checks flag suspicious signals; they do not prove authenticity or legal admissibility.
