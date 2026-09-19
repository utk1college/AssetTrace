import * as inspectionMock from "./mock/inspectionMock";
import * as inspectionReal from "./real/inspectionReal";

export type Role = "owner" | "renter";

export type AssetType = "scooter" | "bike" | "apartment" | "house";

export type InspectionType = "move-in" | "move-out" | "handover";

export type InspectionStatus =
  | "in-progress"
  | "awaiting-confirmation"
  | "locked";

export type EvidencePhase = "baseline" | "return";

export interface EvidenceUploadRequest {
  areaId: string;
  contentType: string;
  phase?: EvidencePhase;
}

export interface EvidenceUploadResponse {
  evidenceId: string;
  uploadUrl: string;
  key: string;
}

export interface SaveEvidenceRequest {
  evidenceId: string;
  areaId: string;
  phase: EvidencePhase;
  key: string;
  sha256: string;
  capturedAt: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  suspicious: boolean;
}

export interface EvidenceMetadata {
  evidenceId: string;
  inspectionId: string;
  areaId: string;
  phase: EvidencePhase;
  key: string;
  sha256: string;
  capturedAt: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  suspicious: boolean;
}

export interface Inspection {
  id: string;
  sessionCode: string;
  assetType: AssetType;
  assetName: string;
  inspectionType: InspectionType;
  status: InspectionStatus;
  ownerId: string;
  renterId?: string;
  areas: string[];
  completedAreaIds: string[];
  createdAt: string;
}

export type CreateInspectionInput = Pick<
  Inspection,
  "assetType" | "assetName" | "inspectionType"
>;

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

const inspectionService: InspectionService = useMock
  ? inspectionMock
  : inspectionReal;

export interface InspectionService {
  createInspection(input: CreateInspectionInput): Promise<Inspection>;
  getInspection(id: string): Promise<Inspection>;
  listInspections(userId: string): Promise<Inspection[]>;
  joinInspection(sessionCode: string): Promise<Inspection>;
  updateInspection(
    id: string,
    updates: Partial<Inspection>,
  ): Promise<Inspection>;
  requestEvidenceUploadUrl(
    inspectionId: string,
    request: EvidenceUploadRequest,
  ): Promise<EvidenceUploadResponse>;
  saveEvidence(
    inspectionId: string,
    request: SaveEvidenceRequest,
  ): Promise<EvidenceMetadata>;
  uploadEvidence(
    uploadUrl: string,
    file: Blob,
    contentType: string,
  ): Promise<void>;
}

export default inspectionService;
