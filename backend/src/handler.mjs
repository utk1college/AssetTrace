import { randomInt, randomUUID } from 'node:crypto'
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime'
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

const region = process.env.AWS_REGION ?? 'us-east-1'
const cognito = new CognitoIdentityProviderClient({ region })
const dynamodb = new DynamoDBClient({ region })
const s3 = new S3Client({ region })
const bedrock = new BedrockRuntimeClient({ region })

const config = {
  userPoolClientId: process.env.USER_POOL_CLIENT_ID,
  inspectionsTable: process.env.INSPECTIONS_TABLE ?? 'AssetTrace-Inspections',
  evidenceTable: process.env.EVIDENCE_TABLE ?? 'AssetTrace-Evidence',
  comparisonsTable: process.env.COMPARISONS_TABLE ?? 'AssetTrace-Comparisons',
  bucket: process.env.EVIDENCE_BUCKET ?? 'assettrace-evidence-650687536843',
  modelId: process.env.BEDROCK_MODEL_ID ?? 'global.amazon.nova-2-lite-v1:0',
}

const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'access-control-allow-origin': process.env.ALLOWED_ORIGIN ?? '*' }, body: JSON.stringify(body) })
const ok = (body, statusCode = 200) => json(statusCode, body)
const fail = (statusCode, code, message) => json(statusCode, { error: { code, message } })
const bodyOf = (event) => { try { return event.body ? JSON.parse(event.body) : {} } catch { throw Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400, code: 'INVALID_JSON' }) } }
const userIdOf = (event) => event.requestContext?.authorizer?.jwt?.claims?.sub ?? event.requestContext?.authorizer?.claims?.sub
const allowedEvidencePhases = new Set(['baseline', 'return'])
const allowedImageTypes = new Map([
  ['image/jpeg', 'jpeg'],
  ['image/png', 'png'],
  ['image/gif', 'gif'],
  ['image/webp', 'webp'],
])
const maxImageBytes = 25 * 1024 * 1024
const maxImagesPerSide = 10
const sessionCodeCharacters = 'ACDEFGHJKLMNPQRTUVWXYZ234679'

function generateSessionCode() {
  return Array.from({ length: 6 }, () => sessionCodeCharacters[randomInt(sessionCodeCharacters.length)]).join('')
}

function requireFields(value, fields) {
  for (const field of fields) if (!value[field]) throw Object.assign(new Error(`Missing required field: ${field}`), { statusCode: 400, code: 'INVALID_REQUEST' })
}

function inspectionItem(input, userId) {
  const id = randomUUID()
  return { inspectionId: id, sk: `META#${id}`, entity: 'inspection', id, sessionCode: input.sessionCode ?? generateSessionCode(), assetType: input.assetType, assetName: input.assetName, inspectionType: input.inspectionType, status: 'in-progress', ownerId: userId, areas: input.areas ?? [], completedAreaIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
}

async function createInspection(event) {
  const input = bodyOf(event); const userId = userIdOf(event); requireFields(input, ['assetType', 'assetName', 'inspectionType'])
  const item = inspectionItem(input, userId)
  await dynamodb.send(new PutItemCommand({ TableName: config.inspectionsTable, Item: marshall(item, { removeUndefinedValues: true }) }))
  return ok(item, 201)
}

async function getInspection(id) {
  const result = await dynamodb.send(new GetItemCommand({ TableName: config.inspectionsTable, Key: marshall({ inspectionId: id, sk: `META#${id}` }) }))
  return result.Item ? unmarshall(result.Item) : null
}

async function readInspection(event) {
  const id = event.pathParameters?.id; const item = await getInspection(id)
  if (!item) return fail(404, 'NOT_FOUND', 'Inspection not found')
  const userId = userIdOf(event); if (![item.ownerId, item.renterId].includes(userId)) return fail(403, 'FORBIDDEN', 'You do not have access to this inspection')
  return ok(item)
}

async function listInspections(event) {
  const userId = userIdOf(event)
  const result = await dynamodb.send(new ScanCommand({ TableName: config.inspectionsTable, FilterExpression: '#ownerId = :ownerId', ExpressionAttributeNames: { '#ownerId': 'ownerId' }, ExpressionAttributeValues: { ':ownerId': { S: userId } } }))
  return ok((result.Items ?? []).map(unmarshall))
}

async function joinInspection(event) {
  const input = bodyOf(event); requireFields(input, ['sessionCode']); const userId = userIdOf(event)
  const result = await dynamodb.send(new ScanCommand({ TableName: config.inspectionsTable, FilterExpression: '#sessionCode = :sessionCode', ExpressionAttributeNames: { '#sessionCode': 'sessionCode' }, ExpressionAttributeValues: { ':sessionCode': { S: input.sessionCode.toUpperCase() } } }))
  const item = result.Items?.[0] ? unmarshall(result.Items[0]) : null
  if (!item) return fail(404, 'INVALID_SESSION', 'Inspection session not found')
  if (item.ownerId === userId) return fail(400, 'INVALID_PARTY', 'The owner cannot join their own inspection')
  await dynamodb.send(new UpdateItemCommand({ TableName: config.inspectionsTable, Key: marshall({ inspectionId: item.inspectionId, sk: item.sk }), UpdateExpression: 'SET renterId = :renterId, updatedAt = :updatedAt', ExpressionAttributeValues: marshall({ ':renterId': userId, ':updatedAt': new Date().toISOString() }) }))
  return ok({ ...item, renterId: userId })
}

async function acknowledge(event) {
  const id = event.pathParameters?.id; const item = await getInspection(id); const userId = userIdOf(event)
  if (!item) return fail(404, 'NOT_FOUND', 'Inspection not found'); if (![item.ownerId, item.renterId].includes(userId)) return fail(403, 'FORBIDDEN', 'You do not have access to this inspection')
  const acknowledgements = { ...(item.acknowledgements ?? {}), [userId]: new Date().toISOString() }
  await dynamodb.send(new UpdateItemCommand({ TableName: config.inspectionsTable, Key: marshall({ inspectionId: id, sk: item.sk }), UpdateExpression: 'SET acknowledgements = :ack, updatedAt = :updatedAt', ExpressionAttributeValues: marshall({ ':ack': acknowledgements, ':updatedAt': new Date().toISOString() }) }))
  return ok({ ...item, acknowledgements })
}

async function lock(event) {
  const id = event.pathParameters?.id; const item = await getInspection(id); const userId = userIdOf(event)
  if (!item) return fail(404, 'NOT_FOUND', 'Inspection not found'); if (item.ownerId !== userId && item.renterId !== userId) return fail(403, 'FORBIDDEN', 'You do not have access to this inspection')
  if (!item.ownerId || !item.renterId || !item.acknowledgements?.[item.ownerId] || !item.acknowledgements?.[item.renterId]) return fail(409, 'ACKNOWLEDGEMENT_REQUIRED', 'Both parties must acknowledge before locking')
  if (item.status === 'locked') return ok(item)
  const lockedAt = new Date().toISOString()
  await dynamodb.send(new UpdateItemCommand({ TableName: config.inspectionsTable, Key: marshall({ inspectionId: id, sk: item.sk }), UpdateExpression: 'SET #status = :locked, lockedAt = :lockedAt, updatedAt = :updatedAt', ConditionExpression: '#status <> :locked', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: marshall({ ':locked': 'locked', ':lockedAt': lockedAt, ':updatedAt': lockedAt }) }))
  return ok({ ...item, status: 'locked', lockedAt })
}

async function uploadUrl(event) {
  const id = event.pathParameters?.id; const item = await getInspection(id); if (!item) return fail(404, 'NOT_FOUND', 'Inspection not found')
  if (![item.ownerId, item.renterId].includes(userIdOf(event))) return fail(403, 'FORBIDDEN', 'You do not have access to this inspection')
  const input = bodyOf(event); requireFields(input, ['areaId', 'contentType']);
  const phase = input.phase ?? (item.status === 'locked' ? 'return' : 'baseline')
  if (!allowedEvidencePhases.has(phase)) return fail(400, 'INVALID_PHASE', 'Evidence phase must be baseline or return')
  if (item.status === 'locked' && phase === 'baseline') return fail(409, 'INSPECTION_LOCKED', 'Baseline evidence cannot be changed after locking')
  if (!allowedImageTypes.has(input.contentType)) return fail(400, 'INVALID_CONTENT_TYPE', 'Evidence must be a JPEG, PNG, GIF, or WebP image')
  const evidenceId = randomUUID(); const key = `inspections/${id}/${evidenceId}`
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: input.contentType }), { expiresIn: 600 })
  return ok({ evidenceId, key, phase, uploadUrl, expiresIn: 600 })
}

async function saveEvidence(event) {
  const id = event.pathParameters?.id; const item = await getInspection(id); if (!item) return fail(404, 'NOT_FOUND', 'Inspection not found')
  if (![item.ownerId, item.renterId].includes(userIdOf(event))) return fail(403, 'FORBIDDEN', 'You do not have access to this inspection')
  const input = bodyOf(event); requireFields(input, ['evidenceId', 'areaId', 'key', 'sha256', 'capturedAt'])
  const phase = input.phase ?? (item.status === 'locked' ? 'return' : 'baseline')
  if (!allowedEvidencePhases.has(phase)) return fail(400, 'INVALID_PHASE', 'Evidence phase must be baseline or return')
  if (item.status === 'locked' && phase === 'baseline') return fail(409, 'INSPECTION_LOCKED', 'Baseline evidence cannot be changed after locking')
  const expectedPrefix = `inspections/${id}/`
  if (typeof input.key !== 'string' || !input.key.startsWith(expectedPrefix)) return fail(400, 'INVALID_EVIDENCE_KEY', 'Evidence key does not belong to this inspection')
  const uploaded = await s3.send(new HeadObjectCommand({ Bucket: config.bucket, Key: input.key }))
  const contentType = uploaded.ContentType?.split(';')[0]?.toLowerCase()
  if (!allowedImageTypes.has(contentType)) return fail(400, 'INVALID_CONTENT_TYPE', 'Evidence must be a JPEG, PNG, GIF, or WebP image')
  const evidence = { inspectionId: id, evidenceId: input.evidenceId, entity: 'evidence', ...input, phase, contentType, sizeBytes: uploaded.ContentLength, capturedBy: userIdOf(event), createdAt: new Date().toISOString() }
  await dynamodb.send(new PutItemCommand({ TableName: config.evidenceTable, Item: marshall(evidence, { removeUndefinedValues: true }), ConditionExpression: 'attribute_not_exists(inspectionId) AND attribute_not_exists(evidenceId)' }))
  return ok(evidence, 201)
}

function validateComparisonInput(input) {
  if (!Array.isArray(input.baselineEvidence) || !Array.isArray(input.returnEvidence) || !input.baselineEvidence.length || !input.returnEvidence.length) {
    throw Object.assign(new Error('baselineEvidence and returnEvidence must be non-empty arrays'), { statusCode: 400, code: 'INVALID_EVIDENCE' })
  }
  if (input.baselineEvidence.length > maxImagesPerSide || input.returnEvidence.length > maxImagesPerSide) {
    throw Object.assign(new Error(`Each evidence set may contain at most ${maxImagesPerSide} images`), { statusCode: 400, code: 'TOO_MANY_IMAGES' })
  }
  for (const evidence of [...input.baselineEvidence, ...input.returnEvidence]) {
    if (!evidence || typeof evidence.key !== 'string' || typeof evidence.areaId !== 'string') {
      throw Object.assign(new Error('Each evidence item requires areaId and key'), { statusCode: 400, code: 'INVALID_EVIDENCE' })
    }
  }
}

async function imageContent(id, evidence, label) {
  if (!evidence.key.startsWith(`inspections/${id}/`)) throw Object.assign(new Error('Evidence key does not belong to this inspection'), { statusCode: 400, code: 'INVALID_EVIDENCE_KEY' })
  const object = await s3.send(new GetObjectCommand({ Bucket: config.bucket, Key: evidence.key }))
  const contentType = object.ContentType?.split(';')[0]?.toLowerCase()
  const format = allowedImageTypes.get(contentType)
  if (!format) throw Object.assign(new Error(`Unsupported image type for ${label}`), { statusCode: 400, code: 'INVALID_CONTENT_TYPE' })
  const bytes = await object.Body.transformToByteArray()
  if (bytes.byteLength > maxImageBytes) throw Object.assign(new Error(`Image ${label} is larger than Bedrock's 25 MB limit`), { statusCode: 413, code: 'IMAGE_TOO_LARGE' })
  return [
    { text: `${label} — area: ${evidence.areaId}` },
    { image: { format, source: { bytes } } },
  ]
}

function parseComparison(text) {
  const candidate = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  const start = candidate.indexOf('{'); const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('Model did not return a JSON object')
  const parsed = JSON.parse(candidate.slice(start, end + 1))
  if (!parsed || !Array.isArray(parsed.changes)) throw new Error('Model JSON must contain a changes array')
  const validStatuses = new Set(['Existing', 'New', 'Uncertain', 'No visible change'])
  parsed.changes = parsed.changes.map((change) => {
    if (!change || typeof change.areaId !== 'string' || typeof change.category !== 'string' || !validStatuses.has(change.status) || typeof change.explanation !== 'string' || typeof change.confidence !== 'number' || change.confidence < 0 || change.confidence > 1) {
      throw new Error('Model returned an invalid change item')
    }
    return { areaId: change.areaId, category: change.category, status: change.status, confidence: change.confidence, explanation: change.explanation }
  })
  return parsed
}

async function compare(event) {
  const id = event.pathParameters?.id; const item = await getInspection(id); if (!item) return fail(404, 'NOT_FOUND', 'Inspection not found')
  if (![item.ownerId, item.renterId].includes(userIdOf(event))) return fail(403, 'FORBIDDEN', 'You do not have access to this inspection')
  if (item.status !== 'locked') return fail(409, 'BASELINE_NOT_LOCKED', 'The baseline must be locked before comparison')
  const input = bodyOf(event); validateComparisonInput(input)
  const content = [{ text: 'You are comparing rental inspection photographs. Inspect the actual images, match baseline and return images by area, and report only visible changes. Return ONLY valid JSON, with no Markdown or extra text, in this exact shape: {"changes":[{"areaId":"string","category":"string","status":"Existing|New|Uncertain|No visible change","confidence":0.0,"explanation":"string"}]}. Confidence must be between 0 and 1. Do not claim legal validity. If an area cannot be confidently compared, use Uncertain.' }]
  for (const evidence of input.baselineEvidence) content.push(...await imageContent(id, evidence, 'BASELINE'))
  for (const evidence of input.returnEvidence) content.push(...await imageContent(id, evidence, 'RETURN'))
  const response = await bedrock.send(new ConverseCommand({ modelId: config.modelId, messages: [{ role: 'user', content }], inferenceConfig: { maxTokens: 1200, temperature: 0 } }))
  const outputText = response.output?.message?.content?.find((part) => typeof part.text === 'string')?.text
  if (!outputText) throw Object.assign(new Error('Bedrock returned no text output'), { statusCode: 502, code: 'BEDROCK_INVALID_OUTPUT' })
  let result
  try { result = parseComparison(outputText) } catch (error) { throw Object.assign(new Error(`Bedrock returned invalid comparison JSON: ${error.message}`), { statusCode: 502, code: 'BEDROCK_INVALID_OUTPUT' }) }
  const comparisonId = randomUUID()
  const comparison = { inspectionId: id, sk: `CMP#${comparisonId}`, comparisonId, entity: 'comparison', status: 'complete', result, createdAt: new Date().toISOString() }
  await dynamodb.send(new PutItemCommand({ TableName: config.comparisonsTable, Item: marshall(comparison) }))
  return ok(comparison, 201)
}

async function auth(event) {
  const input = bodyOf(event)
  if (event.routeKey === 'POST /auth/confirm') {
    requireFields(input, ['email', 'confirmationCode'])
    await cognito.send(new ConfirmSignUpCommand({ ClientId: config.userPoolClientId, Username: input.email, ConfirmationCode: input.confirmationCode }))
    return ok({ confirmed: true })
  }
  requireFields(input, ['email', 'password'])
  if (event.routeKey === 'POST /auth/register') {
    requireFields(input, ['name', 'role'])
    const response = await cognito.send(new SignUpCommand({ ClientId: config.userPoolClientId, Username: input.email, Password: input.password, UserAttributes: [{ Name: 'email', Value: input.email }, { Name: 'name', Value: input.name }, { Name: 'custom:role', Value: input.role }] }))
    return ok({ userSub: response.UserSub, userConfirmed: response.UserConfirmed }, 201)
  }
  const response = await cognito.send(new InitiateAuthCommand({ ClientId: config.userPoolClientId, AuthFlow: 'USER_PASSWORD_AUTH', AuthParameters: { USERNAME: input.email, PASSWORD: input.password } }))
  return ok({ accessToken: response.AuthenticationResult?.AccessToken, idToken: response.AuthenticationResult?.IdToken, refreshToken: response.AuthenticationResult?.RefreshToken, expiresIn: response.AuthenticationResult?.ExpiresIn })
}

export async function handler(event) {
  try {
    const route = event.routeKey
    if (route === 'POST /auth/register' || route === 'POST /auth/login' || route === 'POST /auth/confirm') return await auth(event)
    if (route === 'POST /inspections') return await createInspection(event)
    if (route === 'GET /inspections') return await listInspections(event)
    if (route === 'GET /inspections/{id}') return await readInspection(event)
    if (route === 'POST /inspections/{id}/join') return await joinInspection(event)
    if (route === 'POST /inspections/{id}/evidence/upload-url') return await uploadUrl(event)
    if (route === 'POST /inspections/{id}/evidence') return await saveEvidence(event)
    if (route === 'POST /inspections/{id}/acknowledge') return await acknowledge(event)
    if (route === 'POST /inspections/{id}/lock') return await lock(event)
    if (route === 'POST /inspections/{id}/compare') return await compare(event)
    return fail(404, 'NOT_FOUND', 'Route not found')
  } catch (error) {
    console.error('request_failed', { error: error.message, code: error.code, route: event.routeKey })
    const cognitoErrors = {
      UserNotFoundException: [401, 'INVALID_CREDENTIALS', 'The email or password is incorrect'],
      UserNotConfirmedException: [409, 'USER_NOT_CONFIRMED', 'Confirm your email before signing in'],
      InvalidPasswordException: [400, 'INVALID_PASSWORD', 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol characters'],
      CodeMismatchException: [400, 'INVALID_CONFIRMATION_CODE', 'The confirmation code is invalid'],
      ExpiredCodeException: [400, 'EXPIRED_CONFIRMATION_CODE', 'The confirmation code has expired'],
      NotAuthorizedException: [401, 'INVALID_CREDENTIALS', 'The email or password is incorrect'],
      UsernameExistsException: [409, 'ACCOUNT_EXISTS', 'An account with this email already exists'],
    }
    const mapped = cognitoErrors[error.name]
    if (mapped) return fail(mapped[0], mapped[1], mapped[2])
    if (error.name === 'NotFound' || error.name === 'NoSuchKey') return fail(400, 'EVIDENCE_NOT_FOUND', 'Uploaded evidence was not found')
    if (error.name === 'ConditionalCheckFailedException') return fail(409, 'EVIDENCE_ALREADY_EXISTS', 'This evidence record already exists')
    return fail(error.statusCode ?? 500, error.code ?? 'INTERNAL_ERROR', error.statusCode ? error.message : 'Unexpected server error')
  }
}
