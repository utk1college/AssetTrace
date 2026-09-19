import { INSPECTION_AREAS } from '../../config/constants'
import {
  generateSessionCode,
  isValidSessionCode,
} from '../../utils/sessionCode'
import type {
  CreateInspectionInput,
  Inspection,
} from '../inspectionService'
import authService from '../authService'




const STORAGE_KEY = 'assettrace.inspections'
const MOCK_OWNER_ID = 'mock-owner-1'
const MOCK_RENTER_ID = 'mock-renter-1'
const MOCK_DELAY = 300

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function readInspections(): Inspection[] {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as Inspection[]
  } catch {
    return []
  }
}

function writeInspections(inspections: Inspection[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections))
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function generateUniqueSessionCode(existing: Inspection[]): string {
  const existingCodes = new Set(
    existing.map((inspection) => inspection.sessionCode),
  )

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = generateSessionCode()

    if (!existingCodes.has(code)) {
      return code
    }
  }

  throw new Error('Could not generate a unique inspection code.')
}

export async function createInspection(
  input: CreateInspectionInput,
): Promise<Inspection> {
  await delay()

  const assetName = input.assetName.trim()

  if (!assetName) {
    throw new Error('Asset name is required.')
  }

  const areas = [...INSPECTION_AREAS[input.assetType]]
  const inspections = readInspections()

  const inspection: Inspection = {
    id: createId(),
    sessionCode: generateUniqueSessionCode(inspections),
    assetType: input.assetType,
    assetName,
    inspectionType: input.inspectionType,
    status: 'in-progress',
    ownerId: MOCK_OWNER_ID,
    areas,
    completedAreaIds: [],
    createdAt: new Date().toISOString(),
    acknowledgements: {},
  }

  const currentUser = await authService.getCurrentUser()
  if (currentUser) inspection.ownerId = currentUser.id

  inspections.push(inspection)
  writeInspections(inspections)

  return inspection
}

export async function getInspection(id: string): Promise<Inspection> {
  await delay()

  const inspection = readInspections().find(
    (candidate) => candidate.id === id,
  )

  if (!inspection) {
    throw new Error('Inspection not found.')
  }

  return inspection
}

export async function listInspections(userId: string): Promise<Inspection[]> {
  await delay()

  return readInspections().filter(
    (inspection) =>
      inspection.ownerId === userId ||
      inspection.renterId === userId,
  )
}

export async function joinInspection(
  sessionCode: string,
): Promise<Inspection> {
  await delay()

  const normalizedCode = sessionCode.trim().toUpperCase()

  if (!isValidSessionCode(normalizedCode)) {
    throw new Error('Enter a valid 6-character inspection code.')
  }

  const inspections = readInspections()

  const inspection = inspections.find(
    (candidate) => candidate.sessionCode === normalizedCode,
  )

  if (!inspection) {
    throw new Error('Inspection not found. Check the code and try again.')
  }

  if (!inspection.renterId) {
    const currentUser = await authService.getCurrentUser()
    inspection.renterId = currentUser?.id ?? MOCK_RENTER_ID
    writeInspections(inspections)
  }

  return inspection
}

export async function updateInspection(
  id: string,
  updates: Partial<Inspection>,
): Promise<Inspection> {
  await delay()

  const inspections = readInspections()

  const index = inspections.findIndex(
    (inspection) => inspection.id === id,
  )

  if (index === -1) {
    throw new Error('Inspection not found.')
  }

  const current = inspections[index]

  if (current.status === 'locked') {
    throw new Error('A locked inspection cannot be changed.')
  }

  const nextInspection: Inspection = {
    ...current,
    ...updates,

    // These fields remain immutable through the update facade.
    id: current.id,
    sessionCode: current.sessionCode,
    ownerId: current.ownerId,
    createdAt: current.createdAt,
  }

  inspections[index] = nextInspection
  writeInspections(inspections)

  return nextInspection
}

export async function acknowledgeInspection(
  id: string,
  userId: string,
): Promise<Inspection> {
  await delay()
  const inspections = readInspections()
  const index = inspections.findIndex((inspection) => inspection.id === id)
  if (index === -1) throw new Error('Inspection not found.')

  const current = inspections[index]
  if (current.status === 'locked') throw new Error('This baseline is already locked.')
  if (userId !== current.ownerId && userId !== current.renterId) {
    throw new Error('You are not a participant in this inspection.')
  }

  const next: Inspection = {
    ...current,
    status: 'awaiting-confirmation',
    acknowledgements: {
      ...current.acknowledgements,
      [userId]: new Date().toISOString(),
    },
  }
  inspections[index] = next
  writeInspections(inspections)
  return next
}

export async function lockInspection(id: string): Promise<Inspection> {
  await delay()
  const inspections = readInspections()
  const index = inspections.findIndex((inspection) => inspection.id === id)
  if (index === -1) throw new Error('Inspection not found.')

  const current = inspections[index]
  const ownerAcknowledged = Boolean(current.acknowledgements?.[current.ownerId])
  const renterAcknowledged = Boolean(
    current.renterId && current.acknowledgements?.[current.renterId],
  )
  if (!ownerAcknowledged || !renterAcknowledged) {
    throw new Error('Both parties must confirm before the baseline can be locked.')
  }

  const next: Inspection = {
    ...current,
    status: 'locked',
    lockedAt: new Date().toISOString(),
  }
  inspections[index] = next
  writeInspections(inspections)
  return next
}
