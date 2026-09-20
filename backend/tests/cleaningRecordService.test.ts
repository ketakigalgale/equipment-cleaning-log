import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "../src/lib/errors";
import {
  createCleaningRecord,
  getAuditTrail,
  listCleaningRecords,
  updateCleaningRecord,
} from "../src/services/cleaningRecordService";

function createFakeDb() {
  let idCounter = 0;
  const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

  const equipmentRows: Array<{ id: string; [key: string]: unknown }> = [];
  const cleaningRecordRows: Array<Record<string, unknown>> = [];
  const auditLogRows: Array<Record<string, unknown>> = [];

  const matches = (row: Record<string, unknown>, where: Record<string, unknown> = {}) =>
    Object.entries(where).every(([key, value]) => row[key] === value);

  const db = {
    equipment: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        equipmentRows.find((e) => e.id === where.id) ?? null,
    },
    cleaningRecord: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        cleaningRecordRows.find((r) => r.id === where.id) ?? null,
      findMany: async ({
        where,
        orderBy,
        skip = 0,
        take,
      }: {
        where?: Record<string, unknown>;
        orderBy?: { cleanedAt?: "asc" | "desc" };
        skip?: number;
        take?: number;
      }) => {
        let rows = cleaningRecordRows.filter((r) => matches(r, where));
        if (orderBy?.cleanedAt === "desc") {
          rows = [...rows].sort((a, b) => (b.cleanedAt as Date).getTime() - (a.cleanedAt as Date).getTime());
        }
        return take !== undefined ? rows.slice(skip, skip + take) : rows.slice(skip);
      },
      count: async ({ where }: { where?: Record<string, unknown> }) =>
        cleaningRecordRows.filter((r) => matches(r, where)).length,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const now = new Date();
        const record = { id: nextId("record"), createdAt: now, updatedAt: now, ...data };
        cleaningRecordRows.push(record);
        return record;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = cleaningRecordRows.findIndex((r) => r.id === where.id);
        cleaningRecordRows[idx] = { ...cleaningRecordRows[idx], ...data, updatedAt: new Date() };
        return cleaningRecordRows[idx];
      },
    },
    auditLog: {
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
        auditLogRows.push(...data.map((d) => ({ id: nextId("audit"), changedAt: new Date(), ...d })));
        return { count: data.length };
      },
      findMany: async ({
        where,
        orderBy,
      }: {
        where: { cleaningRecordId: string };
        orderBy?: { changedAt?: "asc" | "desc" };
      }) => {
        let rows = auditLogRows.filter((a) => a.cleaningRecordId === where.cleaningRecordId);
        if (orderBy?.changedAt === "desc") {
          rows = [...rows].sort((a, b) => (b.changedAt as Date).getTime() - (a.changedAt as Date).getTime());
        }
        return rows;
      },
    },
    $transaction: async <T>(fn: (tx: typeof db) => Promise<T>) => fn(db),
    seedEquipment(equipment: { id: string; [key: string]: unknown }) {
      equipmentRows.push(equipment);
    },
  };

  return db;
}

type FakeDb = ReturnType<typeof createFakeDb>;
const asPrisma = (db: FakeDb) => db as unknown as PrismaClient;

describe("cleaningRecordService", () => {
  let db: FakeDb;

  beforeEach(() => {
    db = createFakeDb();
    db.seedEquipment({ id: "eq-1", name: "Tablet Press", code: "TP-1", status: "ACTIVE" });
  });

  it("creates a record and writes a CREATE audit entry per populated field", async () => {
    const record = await createCleaningRecord(
      asPrisma(db),
      "eq-1",
      { cleanedBy: "A. Sharma", cleanedAt: new Date("2026-01-01T00:00:00.000Z"), method: "Wet cleaning", status: "PENDING" },
      "actor-1",
    );

    const audit = await getAuditTrail(asPrisma(db), record.id);
    expect(audit.length).toBe(4); // cleanedBy, cleanedAt, method, status (notes is null, so skipped)
    expect(audit.every((a) => a.action === "CREATE" && a.changedBy === "actor-1")).toBe(true);
    expect(audit.find((a) => a.field === "status")).toMatchObject({ oldValue: null, newValue: "PENDING" });
  });

  it("throws NotFoundError when creating a record for unknown equipment", async () => {
    await expect(
      createCleaningRecord(
        asPrisma(db),
        "does-not-exist",
        { cleanedBy: "A. Sharma", cleanedAt: new Date(), method: "Wet cleaning" },
        "actor-1",
      ),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("writes an UPDATE audit entry with old and new values when a field changes", async () => {
    const record = await createCleaningRecord(
      asPrisma(db),
      "eq-1",
      { cleanedBy: "A. Sharma", cleanedAt: new Date(), method: "Wet cleaning", status: "PENDING" },
      "actor-1",
    );

    await updateCleaningRecord(asPrisma(db), record.id, { status: "VERIFIED" }, "actor-2");

    const audit = await getAuditTrail(asPrisma(db), record.id);
    const updateEntry = audit.find((a) => a.action === "UPDATE");
    expect(updateEntry).toMatchObject({
      field: "status",
      oldValue: "PENDING",
      newValue: "VERIFIED",
      changedBy: "actor-2",
    });
  });

  it("writes no audit entry when an update contains no actual changes", async () => {
    const record = await createCleaningRecord(
      asPrisma(db),
      "eq-1",
      { cleanedBy: "A. Sharma", cleanedAt: new Date(), method: "Wet cleaning" },
      "actor-1",
    );

    await updateCleaningRecord(asPrisma(db), record.id, { cleanedBy: "A. Sharma" }, "actor-2");

    const audit = await getAuditTrail(asPrisma(db), record.id);
    expect(audit.some((a) => a.changedBy === "actor-2")).toBe(false);
  });

  it("throws NotFoundError when updating a record that doesn't exist", async () => {
    await expect(
      updateCleaningRecord(asPrisma(db), "missing-id", { status: "VERIFIED" }, "actor-1"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("paginates and filters cleaning records by status", async () => {
    for (let i = 0; i < 3; i++) {
      await createCleaningRecord(
        asPrisma(db),
        "eq-1",
        { cleanedBy: `User ${i}`, cleanedAt: new Date(2026, 0, i + 1), method: "Wet cleaning", status: "PENDING" },
        "actor-1",
      );
    }
    await createCleaningRecord(
      asPrisma(db),
      "eq-1",
      { cleanedBy: "User 3", cleanedAt: new Date(2026, 0, 10), method: "Wet cleaning", status: "VERIFIED" },
      "actor-1",
    );

    const page1 = await listCleaningRecords(asPrisma(db), "eq-1", { page: 1, limit: 2, skip: 0, status: "PENDING" });
    expect(page1.data).toHaveLength(2);
    expect(page1.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const page2 = await listCleaningRecords(asPrisma(db), "eq-1", { page: 2, limit: 2, skip: 2, status: "PENDING" });
    expect(page2.data).toHaveLength(1);

    const verifiedOnly = await listCleaningRecords(asPrisma(db), "eq-1", { page: 1, limit: 10, skip: 0, status: "VERIFIED" });
    expect(verifiedOnly.data).toHaveLength(1);
    expect(verifiedOnly.data[0].cleanedBy).toBe("User 3");
  });

  it("orders cleaning records by cleanedAt descending", async () => {
    await createCleaningRecord(
      asPrisma(db),
      "eq-1",
      { cleanedBy: "Earlier", cleanedAt: new Date(2026, 0, 1), method: "m" },
      "actor-1",
    );
    await createCleaningRecord(
      asPrisma(db),
      "eq-1",
      { cleanedBy: "Later", cleanedAt: new Date(2026, 0, 5), method: "m" },
      "actor-1",
    );

    const result = await listCleaningRecords(asPrisma(db), "eq-1", { page: 1, limit: 10, skip: 0 });
    expect(result.data.map((r) => r.cleanedBy)).toEqual(["Later", "Earlier"]);
  });
});
