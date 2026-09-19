export type EquipmentStatus = "ACTIVE" | "RETIRED";
export type CleaningStatus = "PENDING" | "VERIFIED";
export type AuditAction = "CREATE" | "UPDATE";

export interface Equipment {
  id: string;
  name: string;
  code: string;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CleaningRecord {
  id: string;
  equipmentId: string;
  cleanedBy: string;
  cleanedAt: string;
  method: string;
  notes: string | null;
  status: CleaningStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  cleaningRecordId: string;
  action: AuditAction;
  changedBy: string;
  changedAt: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface CleaningRecordFormInput {
  cleanedBy: string;
  cleanedAt: string;
  method: string;
  notes: string | null;
  status: CleaningStatus;
}
