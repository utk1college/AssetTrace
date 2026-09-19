import { INSPECTION_AREAS } from '@/config/constants'
import { isValidDeployedSessionCode } from '@/utils/sessionCode'
import { REAL_ACCESS_TOKEN_KEY } from './authReal'
import type { CreateInspectionInput, Inspection } from '../inspectionService'

interface ApiErrorResponse {
  error?: { code?: string; message?: string }
}

interface ApiInspection {
  id?: unknown
  inspectionId?: unknown
  sessionCode?: unknown
  assetType?: unknown
  assetName?: unknown
  inspectionType?: unknown
  status?: unknown
  ownerId?: unknown
  renterId?: unknown
  areas?: unknown
  completedAreaIds?: unknown
  createdAt?: unknown
}

const endpoint = import.meta.env.VITE_API_ENDPOINT?.trim()

function requireEndpoint(): string {
  if (!endpoint) throw new Error('Inspection service is not configured yet.')
  return endpoint.replace(/\/$/, '')
}

function requireToken(): string {
  const token = window.localStorage.getItem(REAL_ACCESS_TOKEN_KEY)
  if (!token) throw new Error('Your session has expired. Please log in again.')
  return token
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${requireEndpoint()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(body?.error?.message ?? 'Inspection request failed. Try again.')
  }

  return response.json() as Promise<T>
}

function stringField(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value) {
    throw new Error(`Inspection response is missing ${field}.`)
  }
  return value
}

function inspectionFromApi(value: ApiInspection): Inspection {
  const inspectionType = value.inspectionType
  const status = value.status
  const assetType = value.assetType

  if (
    inspectionType !== 'move-in' &&
    inspectionType !== 'move-out' &&
    inspectionType !== 'handover'
  ) {
    throw new Error('Inspection response contains an unsupported inspection type.')
  }
  if (
    status !== 'in-progress' &&
    status !== 'awaiting-confirmation' &&
    status !== 'locked'
  ) {
    throw new Error('Inspection response contains an unsupported status.')
  }
  if (
    assetType !== 'scooter' &&
    assetType !== 'bike' &&
    assetType !== 'apartment' &&
    assetType !== 'house'
  ) {
    throw new Error('Inspection response contains an unsupported asset type.')
  }

  const areas = Array.isArray(value.areas)
    ? value.areas.filter((area): area is string => typeof area === 'string')
    : []
  const completedAreaIds = Array.isArray(value.completedAreaIds)
    ? value.completedAreaIds.filter(
        (area): area is string => typeof area === 'string',
      )
    : []

  return {
    id: stringField(value.id ?? value.inspectionId, 'id'),
    sessionCode: stringField(value.sessionCode, 'sessionCode'),
    assetType,
    assetName: stringField(value.assetName, 'assetName'),
    inspectionType,
    status,
    ownerId: stringField(value.ownerId, 'ownerId'),
    renterId: typeof value.renterId === 'string' ? value.renterId : undefined,
    areas,
    completedAreaIds,
    createdAt: stringField(value.createdAt, 'createdAt'),
  }
}

export async function createInspection(
  input: CreateInspectionInput,
): Promise<Inspection> {
  const assetName = input.assetName.trim()
  if (!assetName) throw new Error('Asset name is required.')

  const response = await request<ApiInspection>('/inspections', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      assetName,
      areas: INSPECTION_AREAS[input.assetType],
    }),
  })
  return inspectionFromApi(response)
}

export async function getInspection(id: string): Promise<Inspection> {
  const response = await request<ApiInspection>(
    `/inspections/${encodeURIComponent(id)}`,
  )
  return inspectionFromApi(response)
}

export async function listInspections(
  _userId: string,
): Promise<Inspection[]> {
  const response = await request<ApiInspection[]>('/inspections')
  return response.map(inspectionFromApi)
}

export async function joinInspection(
  sessionCode: string,
): Promise<Inspection> {
  const normalizedCode = sessionCode.trim().toUpperCase()
  if (!isValidDeployedSessionCode(normalizedCode)) {
    throw new Error('Enter a valid 6-character inspection code.')
  }

  // The deployed handler resolves the inspection by sessionCode and does not
  // read the path id, while the API route still requires an {id} segment.
  const response = await request<ApiInspection>(
    `/inspections/${encodeURIComponent(normalizedCode)}/join`,
    {
      method: 'POST',
      body: JSON.stringify({ sessionCode: normalizedCode }),
    },
  )
  return inspectionFromApi(response)
}

export async function updateInspection(
  _id: string,
  _updates: Partial<Inspection>,
): Promise<Inspection> {
  throw new Error(
    'The deployed inspection API does not expose a general update operation.',
  )
}
