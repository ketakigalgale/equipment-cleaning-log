import {
  AuditLogEntry,
  CleaningRecord,
  CleaningRecordFormInput,
  CleaningStatus,
  Equipment,
  EquipmentStatus,
  Paginated,
} from "../types";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}, actor?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(actor ? { "X-Actor": actor } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (body?.error?.message as string) ?? `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, body?.error?.details);
  }

  return body as T;
}

export interface CreateEquipmentInput {
  name: string;
  code: string;
  status?: EquipmentStatus;
}

export interface ListCleaningRecordsParams {
  page: number;
  limit: number;
  status?: CleaningStatus;
}

export const api = {
  listEquipment(status?: EquipmentStatus) {
    const qs = status ? `?status=${status}` : "";
    return request<{ data: Equipment[] }>(`/equipment${qs}`);
  },
  getEquipment(id: string) {
    return request<{ data: Equipment }>(`/equipment/${id}`);
  },
  createEquipment(input: CreateEquipmentInput, actor: string) {
    return request<{ data: Equipment }>("/equipment", { method: "POST", body: JSON.stringify(input) }, actor);
  },
  updateEquipment(id: string, input: Partial<CreateEquipmentInput>, actor: string) {
    return request<{ data: Equipment }>(`/equipment/${id}`, { method: "PUT", body: JSON.stringify(input) }, actor);
  },
  deleteEquipment(id: string, actor: string) {
    return request<void>(`/equipment/${id}`, { method: "DELETE" }, actor);
  },

  listCleaningRecords(equipmentId: string, params: ListCleaningRecordsParams) {
    const qs = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
    if (params.status) qs.set("status", params.status);
    return request<Paginated<CleaningRecord>>(`/equipment/${equipmentId}/cleaning-records?${qs.toString()}`);
  },
  createCleaningRecord(equipmentId: string, input: CleaningRecordFormInput, actor: string) {
    return request<{ data: CleaningRecord }>(
      `/equipment/${equipmentId}/cleaning-records`,
      { method: "POST", body: JSON.stringify(input) },
      actor,
    );
  },
  updateCleaningRecord(id: string, input: Partial<CleaningRecordFormInput>, actor: string) {
    return request<{ data: CleaningRecord }>(`/cleaning-records/${id}`, { method: "PUT", body: JSON.stringify(input) }, actor);
  },
  getAuditTrail(cleaningRecordId: string) {
    return request<{ data: AuditLogEntry[] }>(`/cleaning-records/${cleaningRecordId}/audit`);
  },
};
