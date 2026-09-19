import { INSPECTION_AREAS } from "../../config/constants";
import {
  generateSessionCode,
  isValidSessionCode,
} from "../../utils/sessionCode";
import type {
  CreateInspectionInput,
  EvidenceMetadata,
  EvidenceUploadRequest,
  EvidenceUploadResponse,
  Inspection,
  SaveEvidenceRequest,
} from "../inspectionService";

const STORAGE_KEY = "assettrace.inspections";
const EVIDENCE_STORAGE_KEY = "assettrace.evidence";
const MOCK_OWNER_ID = "mock-owner-1";
const MOCK_RENTER_ID = "mock-renter-1";
const MOCK_DELAY = 300;

function delay(ms = MOCK_DELAY): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readInspections(): Inspection[] {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as Inspection[];
  } catch {
    return [];
  }
}

function writeInspections(inspections: Inspection[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
}

function readEvidence(): EvidenceMetadata[] {
  const stored = localStorage.getItem(EVIDENCE_STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as EvidenceMetadata[];
  } catch {
    return [];
  }
}

function writeEvidence(evidence: EvidenceMetadata[]): void {
  localStorage.setItem(EVIDENCE_STORAGE_KEY, JSON.stringify(evidence));
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function generateUniqueSessionCode(existing: Inspection[]): string {
  const existingCodes = new Set(
    existing.map((inspection) => inspection.sessionCode),
  );

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = generateSessionCode();

    if (!existingCodes.has(code)) {
      return code;
    }
  }

  throw new Error("Could not generate a unique inspection code.");
}

export async function createInspection(
  input: CreateInspectionInput,
): Promise<Inspection> {
  await delay();

  const assetName = input.assetName.trim();

  if (!assetName) {
    throw new Error("Asset name is required.");
  }

  const areas = [...INSPECTION_AREAS[input.assetType]];
  const inspections = readInspections();

  const inspection: Inspection = {
    id: createId(),
    sessionCode: generateUniqueSessionCode(inspections),
    assetType: input.assetType,
    assetName,
    inspectionType: input.inspectionType,
    status: "in-progress",
    ownerId: MOCK_OWNER_ID,
    areas,
    completedAreaIds: [],
    createdAt: new Date().toISOString(),
  };

  inspections.push(inspection);
  writeInspections(inspections);

  return inspection;
}

export async function getInspection(id: string): Promise<Inspection> {
  await delay();

  const inspection = readInspections().find((candidate) => candidate.id === id);

  if (!inspection) {
    throw new Error("Inspection not found.");
  }

  return inspection;
}

export async function listInspections(userId: string): Promise<Inspection[]> {
  await delay();

  return readInspections().filter(
    (inspection) =>
      inspection.ownerId === userId || inspection.renterId === userId,
  );
}

export async function joinInspection(sessionCode: string): Promise<Inspection> {
  await delay();

  const normalizedCode = sessionCode.trim().toUpperCase();

  if (!isValidSessionCode(normalizedCode)) {
    throw new Error("Enter a valid 6-character inspection code.");
  }

  const inspections = readInspections();

  const inspection = inspections.find(
    (candidate) => candidate.sessionCode === normalizedCode,
  );

  if (!inspection) {
    throw new Error("Inspection not found. Check the code and try again.");
  }

  if (!inspection.renterId) {
    inspection.renterId = MOCK_RENTER_ID;
    writeInspections(inspections);
  }

  return inspection;
}

export async function updateInspection(
  id: string,
  updates: Partial<Inspection>,
): Promise<Inspection> {
  await delay();

  const inspections = readInspections();

  const index = inspections.findIndex((inspection) => inspection.id === id);

  if (index === -1) {
    throw new Error("Inspection not found.");
  }

  const current = inspections[index];

  if (current.status === "locked") {
    throw new Error("A locked inspection cannot be changed.");
  }

  const nextInspection: Inspection = {
    ...current,
    ...updates,

    // These fields remain immutable through the update facade.
    id: current.id,
    sessionCode: current.sessionCode,
    ownerId: current.ownerId,
    createdAt: current.createdAt,
  };

  inspections[index] = nextInspection;
  writeInspections(inspections);

  return nextInspection;
}

export async function requestEvidenceUploadUrl(
  inspectionId: string,
  request: EvidenceUploadRequest,
): Promise<EvidenceUploadResponse> {
  await delay();

  const inspection = readInspections().find(
    (candidate) => candidate.id === inspectionId,
  );

  if (!inspection) {
    throw new Error("Inspection not found.");
  }

  if (!request.areaId) {
    throw new Error("Area is required.");
  }

  if (!request.contentType.startsWith("image/")) {
    throw new Error("Only image evidence is supported.");
  }

  const evidenceId = createId();

  return {
    evidenceId,
    uploadUrl: `mock://assettrace/${inspectionId}/${evidenceId}`,
    key: `inspections/${inspectionId}/${evidenceId}`,
  };
}

export async function saveEvidence(
  inspectionId: string,
  request: SaveEvidenceRequest,
): Promise<EvidenceMetadata> {
  await delay();

  const inspection = readInspections().find(
    (candidate) => candidate.id === inspectionId,
  );

  if (!inspection) {
    throw new Error("Inspection not found.");
  }

  if (!request.evidenceId) {
    throw new Error("Evidence ID is required.");
  }

  if (!request.areaId) {
    throw new Error("Area is required.");
  }

  const evidence: EvidenceMetadata = {
    evidenceId: request.evidenceId,
    inspectionId,
    areaId: request.areaId,
    phase: request.phase,
    key: request.key,
    sha256: request.sha256,
    capturedAt: request.capturedAt,
    location: request.location,
    suspicious: request.suspicious,
  };

  const allEvidence = readEvidence();

  allEvidence.push(evidence);
  writeEvidence(allEvidence);

  return evidence;
}

export async function uploadEvidence(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  await delay();

  if (!uploadUrl.startsWith("mock://")) {
    throw new Error("Invalid mock upload URL.");
  }

  if (!file.size) {
    throw new Error("Evidence file is empty.");
  }

  if (!contentType.startsWith("image/")) {
    throw new Error("Only image evidence is supported.");
  }
}
