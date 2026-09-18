import * as inspectionMock from './mock/inspectionMock'
import * as inspectionReal from './real/inspectionReal'

export type Role = 'owner' | 'renter'

export type AssetType =
  | 'scooter'
  | 'bike'
  | 'apartment'
  | 'house'

export type InspectionType = 'move-in' | 'move-out'

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
}

export type CreateInspectionInput = Pick<
  Inspection,
  'assetType' | 'assetName' | 'inspectionType'
>

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

const inspectionService = useMock
  ? inspectionMock
  : inspectionReal

export default inspectionService