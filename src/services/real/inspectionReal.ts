import type {
  CreateInspectionInput,
  Inspection,
} from '../inspectionService'

function realModeUnavailable(): never {
  throw new Error(
    'Real inspection service is not available yet. Ask the team lead for the deployed API contract.',
  )
}

export async function createInspection(
  _input: CreateInspectionInput,
): Promise<Inspection> {
  return realModeUnavailable()
}

export async function getInspection(_id: string): Promise<Inspection> {
  return realModeUnavailable()
}

export async function listInspections(
  _userId: string,
): Promise<Inspection[]> {
  return realModeUnavailable()
}

export async function joinInspection(
  _sessionCode: string,
): Promise<Inspection> {
  return realModeUnavailable()
}

export async function updateInspection(
  _id: string,
  _updates: Partial<Inspection>,
): Promise<Inspection> {
  return realModeUnavailable()
}