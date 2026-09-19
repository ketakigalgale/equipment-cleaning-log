import { AuditLog, CleaningRecord, PrismaClient } from "@prisma/client";
import { diffFields, diffForCreate } from "../lib/auditDiff";
import { NotFoundError } from "../lib/errors";
import { buildPaginationMeta, PaginatedResult } from "../lib/pagination";
import { CreateCleaningRecordInput, UpdateCleaningRecordInput } from "../schemas/cleaningRecord.schema";

// The subset of CleaningRecord fields that are user-editable and therefore
// audited. `id`, `equipmentId`, `createdAt`, `updatedAt` are excluded:
// they either never change or aren't meaningful to an auditor.
export const TRACKED_FIELDS = ["cleanedBy", "cleanedAt", "method", "notes", "status"] as const satisfies ReadonlyArray<
  keyof CleaningRecord & string
>;

export async function createCleaningRecord(
  db: PrismaClient,
  equipmentId: string,
  input: CreateCleaningRecordInput,
  actor: string,
): Promise<CleaningRecord> {
  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) throw new NotFoundError("Equipment", equipmentId);

  return db.$transaction(async (tx) => {
    const record = await tx.cleaningRecord.create({
      data: {
        equipmentId,
        cleanedBy: input.cleanedBy,
        cleanedAt: input.cleanedAt,
        method: input.method,
        notes: input.notes ?? null,
        status: input.status ?? "PENDING",
      },
    });

    const changes = diffForCreate(record, TRACKED_FIELDS);
    if (changes.length > 0) {
      await tx.auditLog.createMany({
        data: changes.map((change) => ({
          cleaningRecordId: record.id,
          action: "CREATE" as const,
          changedBy: actor,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        })),
      });
    }

    return record;
  });
}

export async function updateCleaningRecord(
  db: PrismaClient,
  id: string,
  input: UpdateCleaningRecordInput,
  actor: string,
): Promise<CleaningRecord> {
  const existing = await db.cleaningRecord.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("CleaningRecord", id);

  const changes = diffFields(existing, input, TRACKED_FIELDS);
  if (changes.length === 0) {
    // Nothing actually changed (e.g. re-saving the form with identical
    // values) - skip the write so we don't create audit noise.
    return existing;
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.cleaningRecord.update({ where: { id }, data: input });
    await tx.auditLog.createMany({
      data: changes.map((change) => ({
        cleaningRecordId: id,
        action: "UPDATE" as const,
        changedBy: actor,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
      })),
    });
    return updated;
  });
}

export interface ListCleaningRecordsParams {
  page: number;
  limit: number;
  skip: number;
  status?: "PENDING" | "VERIFIED";
}

export async function listCleaningRecords(
  db: PrismaClient,
  equipmentId: string,
  params: ListCleaningRecordsParams,
): Promise<PaginatedResult<CleaningRecord>> {
  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) throw new NotFoundError("Equipment", equipmentId);

  const where = { equipmentId, ...(params.status ? { status: params.status } : {}) };

  const [data, total] = await Promise.all([
    db.cleaningRecord.findMany({
      where,
      orderBy: { cleanedAt: "desc" },
      skip: params.skip,
      take: params.limit,
    }),
    db.cleaningRecord.count({ where }),
  ]);

  return { data, pagination: buildPaginationMeta(total, params.page, params.limit) };
}

export async function getAuditTrail(db: PrismaClient, cleaningRecordId: string): Promise<AuditLog[]> {
  const record = await db.cleaningRecord.findUnique({ where: { id: cleaningRecordId } });
  if (!record) throw new NotFoundError("CleaningRecord", cleaningRecordId);

  return db.auditLog.findMany({
    where: { cleaningRecordId },
    orderBy: { changedAt: "desc" },
  });
}
