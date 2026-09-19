import * as inspectionMock from './mock/inspectionMock'
import * as inspectionReal from './real/inspectionReal'

export type Role = 'owner' | 'renter'

export type AssetType =
  | 'scooter'
  | 'bike'
  | 'apartment'
  | 'house'

export type InspectionType = 'move-in' | 'move-out' | 'handover'

export type InspectionStatus =
  | 'in-progress'
  | 'awaiting-confirmation'
  | 'locked'

export interface Inspection {
  id: string
  sessionCode: string
  assetType: AssetType
  assetName: string
  inspectionType: InspectionType
  status: InspectionStatus
  ownerId: string
  renterId?: string
  areas: string[]
  completedAreaIds: string[]
  createdAt: string
  acknowledgements?: Record<string, string>
  lockedAt?: string
}

export type CreateInspectionInput = Pick<
  Inspection,
  'assetType' | 'assetName' | 'inspectionType'
>

export interface InspectionService {
  createInspection(input: CreateInspectionInput): Promise<Inspection>
  getInspection(id: string): Promise<Inspection>
  listInspections(userId: string): Promise<Inspection[]>
  joinInspection(sessionCode: string): Promise<Inspection>
  updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection>
  acknowledgeInspection(id: string, userId: string): Promise<Inspection>
  lockInspection(id: string): Promise<Inspection>
}

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

const inspectionService: InspectionService = useMock
  ? inspectionMock
  : inspectionReal

export default inspectionService
