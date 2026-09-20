import { INSPECTION_AREAS } from "@/config/constants";
import { isValidDeployedSessionCode } from "@/utils/sessionCode";
import { clearRealSession, REAL_ACCESS_TOKEN_KEY } from "./authReal";
import type {
  Comparison,
  ComparisonStatus,
  CreateInspectionInput,
  EvidenceMetadata,
  EvidenceUploadRequest,
  EvidenceUploadResponse,
  Inspection,
  SaveEvidenceRequest,
} from "../inspectionService";

interface ApiErrorResponse {
  error?: { code?: string; message?: string };
}

interface ApiInspection {
  id?: unknown;
  inspectionId?: unknown;
  sessionCode?: unknown;
  assetType?: unknown;
  assetName?: unknown;
  customAssetType?: unknown;
  inspectionType?: unknown;
  status?: unknown;
  ownerId?: unknown;
  renterId?: unknown;
  areas?: unknown;
  completedAreaIds?: unknown;
  capturePoints?: unknown;
  createdAt?: unknown;
  acknowledgements?: unknown
  lockedAt?: unknown
  returnCompletedAt?: unknown
}

const endpoint = import.meta.env.VITE_API_ENDPOINT?.trim();

function requireEndpoint(): string {
  if (!endpoint) throw new Error("Inspection service is not configured yet.");
  return endpoint.replace(/\/$/, "");
}

function requireToken(): string {
  const token = window.localStorage.getItem(REAL_ACCESS_TOKEN_KEY);
  if (!token) throw new Error("Your session has expired. Please log in again.");
  return token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${requireEndpoint()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireToken()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    if (response.status === 401) {
      clearRealSession();
      throw new Error("Your session has expired. Please sign in again.");
    }
    throw new Error(
      body?.error?.message ?? "Inspection request failed. Try again.",
    );
  }

  return response.json() as Promise<T>;
}

async function uploadEvidenceToS3(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Evidence upload failed. Please try again.");
  }
}

export async function uploadEvidence(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  await uploadEvidenceToS3(uploadUrl, file, contentType);
}

function stringField(value: unknown, field: string): string {
  if (typeof value !== "string" || !value) {
    throw new Error(`Inspection response is missing ${field}.`);
  }
  return value;
}

function inspectionFromApi(value: ApiInspection): Inspection {
  const inspectionType = value.inspectionType;
  const status = value.status;
  const assetType = value.assetType;

  if (
    inspectionType !== "move-in" &&
    inspectionType !== "move-out" &&
    inspectionType !== "handover"
  ) {
    throw new Error(
      "Inspection response contains an unsupported inspection type.",
    );
  }
  if (
    status !== "in-progress" &&
    status !== "awaiting-confirmation" &&
    status !== "locked"
  ) {
    throw new Error("Inspection response contains an unsupported status.");
  }
  if (
    assetType !== "scooter" &&
    assetType !== "bike" &&
    assetType !== "apartment" &&
    assetType !== "house" &&
    assetType !== "wall" &&
    assetType !== "custom"
  ) {
    throw new Error("Inspection response contains an unsupported asset type.");
  }

  const areas = Array.isArray(value.areas)
    ? value.areas.filter((area): area is string => typeof area === "string")
    : [];
  const completedAreaIds = Array.isArray(value.completedAreaIds)
    ? value.completedAreaIds.filter(
        (area): area is string => typeof area === "string",
      )
    : [];
  const capturePoints = Array.isArray(value.capturePoints)
    ? value.capturePoints.filter((point): point is { id: string; title: string; order: number } => Boolean(point) && typeof point === "object" && typeof (point as { id?: unknown }).id === "string" && typeof (point as { title?: unknown }).title === "string").map((point, index) => ({ id: point.id, title: point.title, order: typeof point.order === "number" ? point.order : index }))
    : areas.map((area, index) => ({ id: area, title: area, order: index }));
  const acknowledgements =
  value.acknowledgements && typeof value.acknowledgements === "object"
      ? Object.fromEntries(
          Object.entries(value.acknowledgements).filter(
            ([userId, timestamp]) =>
              Boolean(userId) && typeof timestamp === "string" && Boolean(timestamp),
          ),
        )
      : undefined;

  return {
    id: stringField(value.id ?? value.inspectionId, "id"),
    sessionCode: stringField(value.sessionCode, "sessionCode"),
    assetType,
    assetName: stringField(value.assetName, "assetName"),
    customAssetType: typeof value.customAssetType === "string" ? value.customAssetType : undefined,
    inspectionType,
    status,
    ownerId: typeof value.ownerId === "string" ? value.ownerId : undefined,
    renterId: typeof value.renterId === "string" ? value.renterId : undefined,
    areas,
    capturePoints,
    completedAreaIds,
    createdAt: stringField(value.createdAt, "createdAt"),
    acknowledgements,
    lockedAt: typeof value.lockedAt === "string" ? value.lockedAt : undefined,
    returnCompletedAt: typeof value.returnCompletedAt === "string" ? value.returnCompletedAt : undefined,
  };
}

function comparisonFromApi(value: unknown): Comparison {
  const record = value as Partial<Comparison>;
  if (
    typeof record.comparisonId !== "string" ||
    typeof record.inspectionId !== "string" ||
    record.status !== "complete" ||
    typeof record.createdAt !== "string" ||
    !record.result ||
    !Array.isArray(record.result.changes)
  ) {
    throw new Error("Comparison response is invalid.");
  }

  const changes = record.result.changes.map((change) => {
    const candidate = change as unknown as Record<string, unknown>;
    const status = candidate.status as ComparisonStatus;
    if (
      typeof candidate.areaId !== "string" ||
      typeof candidate.category !== "string" ||
      !["Existing", "New", "Uncertain", "No visible change"].includes(status) ||
      typeof candidate.confidence !== "number" ||
      typeof candidate.explanation !== "string"
    ) {
      throw new Error("Comparison response contains an invalid change.");
    }
    return {
      areaId: candidate.areaId,
      capturePointTitle: typeof candidate.capturePointTitle === "string" ? candidate.capturePointTitle : undefined,
      category: candidate.category,
      status,
      confidence: candidate.confidence,
      explanation: candidate.explanation,
    };
  });

  return {
    comparisonId: record.comparisonId,
    inspectionId: record.inspectionId,
    status: "complete",
    result: { changes },
    createdAt: record.createdAt,
  };
}

export async function createInspection(
  input: CreateInspectionInput,
): Promise<Inspection> {
  const assetName = input.assetName.trim();
  if (!assetName) throw new Error("Asset name is required.");

  const response = await request<ApiInspection>("/inspections", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      assetName,
      areas: INSPECTION_AREAS[input.assetType],
      capturePoints: input.capturePoints,
    }),
  });
  return inspectionFromApi(response);
}

export async function getInspection(id: string): Promise<Inspection> {
  const response = await request<ApiInspection>(
    `/inspections/${encodeURIComponent(id)}`,
  );
  return inspectionFromApi(response);
}

export async function listInspections(_userId: string): Promise<Inspection[]> {
  const response = await request<ApiInspection[]>("/inspections");
  return response.map(inspectionFromApi);
}

export async function joinInspection(sessionCode: string): Promise<Inspection> {
  const normalizedCode = sessionCode.trim().toUpperCase();
  if (!isValidDeployedSessionCode(normalizedCode)) {
    throw new Error("Enter a valid 6-character inspection code.");
  }

  // The deployed handler resolves the inspection by sessionCode and does not
  // read the path id, while the API route still requires an {id} segment.
  const response = await request<ApiInspection>(
    `/inspections/${encodeURIComponent(normalizedCode)}/join`,
    {
      method: "POST",
      body: JSON.stringify({ sessionCode: normalizedCode }),
    },
  );
  return inspectionFromApi(response);
}

export async function updateInspection(
  _id: string,
  _updates: Partial<Inspection>,
): Promise<Inspection> {
  throw new Error(
    "The deployed inspection API does not expose a general update operation.",
  );
}

export async function requestEvidenceUploadUrl(
  inspectionId: string,
  requestData: EvidenceUploadRequest,
): Promise<EvidenceUploadResponse> {
  const response = await request<{
    evidenceId?: unknown;
    uploadUrl?: unknown;
    key?: unknown;
  }>(`/inspections/${encodeURIComponent(inspectionId)}/evidence/upload-url`, {
    method: "POST",
    body: JSON.stringify(requestData),
  });

  if (typeof response.evidenceId !== "string" || !response.evidenceId) {
    throw new Error("Evidence upload response is missing evidenceId.");
  }

  if (typeof response.uploadUrl !== "string" || !response.uploadUrl) {
    throw new Error("Evidence upload response is missing uploadUrl.");
  }

  if (typeof response.key !== "string" || !response.key) {
    throw new Error("Evidence upload response is missing key.");
  }

  return {
    evidenceId: response.evidenceId,
    uploadUrl: response.uploadUrl,
    key: response.key,
  };
}

export async function saveEvidence(
  inspectionId: string,
  requestData: SaveEvidenceRequest,
): Promise<EvidenceMetadata> {
  const response = await request<EvidenceMetadata>(
    `/inspections/${encodeURIComponent(inspectionId)}/evidence`,
    {
      method: "POST",
      body: JSON.stringify(requestData),
    },
  );

  return response;
}

export async function listEvidence(
  inspectionId: string,
  phase?: "baseline" | "return",
): Promise<EvidenceMetadata[]> {
  const query = phase ? `?phase=${encodeURIComponent(phase)}` : "";
  const response = await request<unknown[]>(
    `/inspections/${encodeURIComponent(inspectionId)}/evidence${query}`,
  );
  return response as EvidenceMetadata[];
}

export async function acknowledgeInspection(
  id: string,
  _userId: string,
): Promise<Inspection> {
  const response = await request<ApiInspection>(
    `/inspections/${encodeURIComponent(id)}/acknowledge`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return inspectionFromApi(response);
}

export async function lockInspection(id: string): Promise<Inspection> {
  const response = await request<ApiInspection>(
    `/inspections/${encodeURIComponent(id)}/lock`,
    { method: "POST", body: JSON.stringify({}) },
  );
  return inspectionFromApi(response);
}

export async function compareInspection(
  inspectionId: string,
  baselineEvidence: EvidenceMetadata[],
  returnEvidence: EvidenceMetadata[],
): Promise<Comparison> {
  const response = await request<unknown>(
    `/inspections/${encodeURIComponent(inspectionId)}/compare`,
    {
      method: "POST",
      body: JSON.stringify({ baselineEvidence, returnEvidence }),
    },
  );
  return comparisonFromApi(response);
}

export async function getLatestComparison(
  inspectionId: string,
): Promise<Comparison | null> {
  try {
    const response = await request<unknown>(
      `/inspections/${encodeURIComponent(inspectionId)}/compare`,
    );
    return comparisonFromApi(response);
  } catch (error) {
    if (error instanceof Error && error.message === "No comparison is available yet") {
      return null;
    }
    throw error;
  }
}
