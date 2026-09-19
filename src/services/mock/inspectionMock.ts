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
  Comparison,
  EvidencePhase,
  CapturePoint,
  Inspection,
  SaveEvidenceRequest,
} from "../inspectionService";
import authService from "../authService";

const STORAGE_KEY = "assettrace.inspections";
const EVIDENCE_STORAGE_KEY = "assettrace.evidence";
const COMPARISON_STORAGE_KEY = "assettrace.comparisons";
const MOCK_OWNER_ID = "mock-owner-1";
const MOCK_RENTER_ID = "mock-renter-1";
const MOCK_DELAY = 300;
const evidenceViewUrls = new Map<string, string>();

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

function readComparisons(): Comparison[] {
  const stored = localStorage.getItem(COMPARISON_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as Comparison[]) : [];
  } catch {
    return [];
  }
}

function writeComparisons(comparisons: Comparison[]): void {
  localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(comparisons));
}

function normalizeStoredInspection(inspection: Inspection): Inspection {
  if (inspection.capturePoints?.length) return inspection;
  return {
    ...inspection,
    capturePoints: inspection.areas.map((title, order) => ({
      id: title,
      title,
      order,
    })),
  };
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

  const defaultAreas = [...INSPECTION_AREAS[input.assetType]];
  const capturePoints = normalizeCapturePoints(input.capturePoints, defaultAreas);
  const areas = capturePoints.map((point) => point.id);
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
    capturePoints,
    completedAreaIds: [],
    createdAt: new Date().toISOString(),
    acknowledgements: {},
  };

  const currentUser = await authService.getCurrentUser();
  if (currentUser) inspection.ownerId = currentUser.id;

  inspections.push(inspection);
  writeInspections(inspections);

  return inspection;
}

function normalizeCapturePoints(points: CapturePoint[] | undefined, areas: string[]): CapturePoint[] {
  const source = points?.length ? points : areas.map((title, order) => ({ id: `area-${order + 1}`, title, order }));
  return source.map((point, order) => ({
    id: point.id || `capture-${order + 1}`,
    title: point.title.trim(),
    order,
  })).filter((point) => point.title);
}

export async function getInspection(id: string): Promise<Inspection> {
  await delay();

  const inspection = readInspections().find((candidate) => candidate.id === id);
  if (!inspection) throw new Error("Inspection not found.");
  return normalizeStoredInspection(inspection);
}

export async function listInspections(userId: string): Promise<Inspection[]> {
  await delay();

  return readInspections().filter(
    (inspection) =>
      inspection.ownerId === userId || inspection.renterId === userId,
  ).map(normalizeStoredInspection);
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
    const currentUser = await authService.getCurrentUser();
    inspection.renterId = currentUser?.id ?? MOCK_RENTER_ID;
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

  const currentUser = await authService.getCurrentUser();
  if (request.phase === "baseline" && currentUser?.id !== inspection.ownerId) {
    throw new Error("Only the owner can upload baseline evidence.");
  }
  if (request.phase === "return" && currentUser?.id !== inspection.renterId) {
    throw new Error("Only the renter can upload return evidence.");
  }
  if (request.phase === "return" && inspection.status !== "locked") {
    throw new Error("The baseline must be locked before return evidence can be uploaded.");
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

  const currentUser = await authService.getCurrentUser();
  if (request.phase === "baseline" && currentUser?.id !== inspection.ownerId) {
    throw new Error("Only the owner can save baseline evidence.");
  }
  if (request.phase === "return" && currentUser?.id !== inspection.renterId) {
    throw new Error("Only the renter can save return evidence.");
  }
  if (request.phase === "return" && inspection.status !== "locked") {
    throw new Error("The baseline must be locked before return evidence can be saved.");
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
    viewUrl: evidenceViewUrls.get(request.evidenceId),
  };

  const allEvidence = readEvidence();

  allEvidence.push(evidence);
  writeEvidence(allEvidence);

  if (request.phase === "baseline" && !inspection.completedAreaIds.includes(request.areaId)) {
    const inspections = readInspections();
    const inspectionIndex = inspections.findIndex((item) => item.id === inspectionId);
    if (inspectionIndex !== -1) {
      inspections[inspectionIndex] = {
        ...inspections[inspectionIndex],
        completedAreaIds: [
          ...inspections[inspectionIndex].completedAreaIds,
          request.areaId,
        ],
      };
      writeInspections(inspections);
    }
  }

  return evidence;
}

export async function listEvidence(
  inspectionId: string,
  phase?: EvidencePhase,
): Promise<EvidenceMetadata[]> {
  await delay();
  const evidence = readEvidence().filter((item) => item.inspectionId === inspectionId);
  return phase ? evidence.filter((item) => item.phase === phase) : evidence;
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

  const evidenceId = uploadUrl.split("/").pop();
  if (evidenceId) evidenceViewUrls.set(evidenceId, URL.createObjectURL(file));
}

export async function acknowledgeInspection(
  id: string,
  userId: string,
): Promise<Inspection> {
  await delay();
  const inspections = readInspections();
  const index = inspections.findIndex((inspection) => inspection.id === id);
  if (index === -1) throw new Error("Inspection not found.");

  const current = inspections[index];
  if (current.status === "locked") throw new Error("This baseline is already locked.");
  if (current.completedAreaIds.length < current.areas.length) {
    throw new Error("All baseline areas must be captured before confirmation.");
  }
  if (userId !== current.ownerId && userId !== current.renterId) {
    throw new Error("You are not a participant in this inspection.");
  }

  const next: Inspection = {
    ...current,
    status: "awaiting-confirmation",
    acknowledgements: {
      ...current.acknowledgements,
      [userId]: new Date().toISOString(),
    },
  };
  inspections[index] = next;
  writeInspections(inspections);
  return next;
}

export async function lockInspection(id: string): Promise<Inspection> {
  await delay();
  const inspections = readInspections();
  const index = inspections.findIndex((inspection) => inspection.id === id);
  if (index === -1) throw new Error("Inspection not found.");

  const current = inspections[index];
  const ownerAcknowledged = Boolean(current.acknowledgements?.[current.ownerId]);
  const renterAcknowledged = Boolean(
    current.renterId && current.acknowledgements?.[current.renterId],
  );
  if (!ownerAcknowledged || !renterAcknowledged) {
    throw new Error("Both parties must confirm before the baseline can be locked.");
  }

  const next: Inspection = {
    ...current,
    status: "locked",
    lockedAt: new Date().toISOString(),
  };
  inspections[index] = next;
  writeInspections(inspections);
  return next;
}

export async function compareInspection(
  inspectionId: string,
  baselineEvidence: EvidenceMetadata[],
  returnEvidence: EvidenceMetadata[],
): Promise<Comparison> {
  await delay();
  const inspection = await getInspection(inspectionId);
  if (inspection.status !== "locked") {
    throw new Error("The baseline must be locked before comparison.");
  }
  if (!baselineEvidence.length || !returnEvidence.length) {
    throw new Error("Baseline and return evidence are required.");
  }

  const returnAreas = new Set(returnEvidence.map((item) => item.areaId));
  const changes = baselineEvidence.map((item) => ({
    areaId: item.areaId,
    capturePointTitle: item.capturePointTitle,
    category: "Condition",
    status: returnAreas.has(item.areaId) ? ("No visible change" as const) : ("Uncertain" as const),
    confidence: returnAreas.has(item.areaId) ? 0.5 : 0.2,
    explanation: returnAreas.has(item.areaId)
      ? "Mock comparison requires human review of the matched evidence."
      : "No matching return evidence was found for this area.",
  }));
  const comparison: Comparison = {
    comparisonId: createId(),
    inspectionId,
    status: "complete",
    result: { changes },
    createdAt: new Date().toISOString(),
  };
  writeComparisons([comparison, ...readComparisons()]);
  return comparison;
}

export async function getLatestComparison(
  inspectionId: string,
): Promise<Comparison | null> {
  await delay();
  return (
    readComparisons()
      .filter((comparison) => comparison.inspectionId === inspectionId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
  );
}
