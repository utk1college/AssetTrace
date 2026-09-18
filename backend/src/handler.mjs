import { randomUUID } from 'node:crypto'
import {
  CognitoIdentityProviderClient,
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
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
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
  modelId: process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-haiku-20240307-v1:0',
}

const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'access-control-allow-origin': process.env.ALLOWED_ORIGIN ?? '*' }, body: JSON.stringify(body) })
const ok = (body, statusCode = 200) => json(statusCode, body)
const fail = (statusCode, code, message) => json(statusCode, { error: { code, message } })
const bodyOf = (event) => { try { return event.body ? JSON.parse(event.body) : {} } catch { throw Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400, code: 'INVALID_JSON' }) } }
const userIdOf = (event) => event.requestContext?.authorizer?.jwt?.claims?.sub ?? event.requestContext?.authorizer?.claims?.sub

function requireFields(value, fields) {
  for (const field of fields) if (!value[field]) throw Object.assign(new Error(`Missing required field: ${field}`), { statusCode: 400, code: 'INVALID_REQUEST' })
}

function inspectionItem(input, userId) {
  const id = randomUUID()
  return { inspectionId: id, sk: `META#${id}`, entity: 'inspection', id, sessionCode: input.sessionCode ?? randomUUID().slice(0, 6).toUpperCase(), assetType: input.assetType, assetName: input.assetName, inspectionType: input.inspectionType, status: 'in-progress', ownerId: userId, areas: input.areas ?? [], completedAreaIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
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
  const input = bodyOf(event); requireFields(input, ['areaId', 'contentType']); const evidenceId = randomUUID(); const key = `inspections/${id}/${evidenceId}`
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: input.contentType }), { expiresIn: 600 })
  return ok({ evidenceId, key, uploadUrl, expiresIn: 600 })
}

async function saveEvidence(event) {
  const id = event.pathParameters?.id; const item = await getInspection(id); if (!item) return fail(404, 'NOT_FOUND', 'Inspection not found')
  if (![item.ownerId, item.renterId].includes(userIdOf(event))) return fail(403, 'FORBIDDEN', 'You do not have access to this inspection')
  const input = bodyOf(event); requireFields(input, ['evidenceId', 'areaId', 'key', 'sha256', 'capturedAt'])
  const evidence = { inspectionId: id, evidenceId: input.evidenceId, entity: 'evidence', ...input, capturedBy: userIdOf(event), createdAt: new Date().toISOString() }
  await dynamodb.send(new PutItemCommand({ TableName: config.evidenceTable, Item: marshall(evidence, { removeUndefinedValues: true }) }))
  return ok(evidence, 201)
}

async function compare(event) {
  const id = event.pathParameters?.id; const item = await getInspection(id); if (!item) return fail(404, 'NOT_FOUND', 'Inspection not found')
  if (![item.ownerId, item.renterId].includes(userIdOf(event))) return fail(403, 'FORBIDDEN', 'You do not have access to this inspection')
  const input = bodyOf(event); requireFields(input, ['baselineEvidence', 'returnEvidence']);
  const prompt = 'Compare these rental inspection evidence references and return JSON with changes: an array of {areaId, category, status, confidence, explanation}. Status must be Existing, New, Uncertain, or No visible change. Do not claim legal validity.'
  const response = await bedrock.send(new ConverseCommand({ modelId: config.modelId, messages: [{ role: 'user', content: [{ text: `${prompt}\nBaseline: ${JSON.stringify(input.baselineEvidence)}\nReturn: ${JSON.stringify(input.returnEvidence)}` }] }], inferenceConfig: { maxTokens: 1200, temperature: 0 } }))
  const comparison = { inspectionId: id, comparisonId: randomUUID(), entity: 'comparison', status: 'complete', result: response.output?.message?.content?.[0]?.text ?? '', createdAt: new Date().toISOString() }
  await dynamodb.send(new PutItemCommand({ TableName: config.comparisonsTable, Item: marshall(comparison) }))
  return ok(comparison, 201)
}

async function auth(event) {
  const input = bodyOf(event); requireFields(input, ['email', 'password'])
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
    if (route === 'POST /auth/register' || route === 'POST /auth/login') return await auth(event)
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
    return fail(error.statusCode ?? 500, error.code ?? 'INTERNAL_ERROR', error.statusCode ? error.message : 'Unexpected server error')
  }
}
