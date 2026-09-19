import { describe, expect, it } from "vitest";
import { diffFields, diffForCreate, normalizeValue } from "../src/lib/auditDiff";

interface Fixture {
  cleanedBy: string;
  cleanedAt: Date;
  method: string;
  notes: string | null;
  status: "PENDING" | "VERIFIED";
}

const FIELDS = ["cleanedBy", "cleanedAt", "method", "notes", "status"] as const;

const base: Fixture = {
  cleanedBy: "A. Sharma",
  cleanedAt: new Date("2026-01-01T10:00:00.000Z"),
  method: "Wet cleaning",
  notes: null,
  status: "PENDING",
};

describe("diffFields", () => {
  it("returns no changes when the update payload matches the current values", () => {
    const changes = diffFields(base, { cleanedBy: "A. Sharma", status: "PENDING" }, FIELDS);
    expect(changes).toEqual([]);
  });

  it("reports a single changed field with old and new values", () => {
    const changes = diffFields(base, { status: "VERIFIED" }, FIELDS);
    expect(changes).toEqual([{ field: "status", oldValue: "PENDING", newValue: "VERIFIED" }]);
  });

  it("only diffs fields present in the update payload, even if others would differ", () => {
    // `method` on `base` differs from some hypothetical other value, but since
    // the caller never included `method` in the payload, it must not appear.
    const changes = diffFields(base, { cleanedBy: "R. Iyer" }, FIELDS);
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toBe("cleanedBy");
  });

  it("treats an equal Date and ISO string as unchanged", () => {
    const changes = diffFields(base, { cleanedAt: new Date(base.cleanedAt.getTime()) }, FIELDS);
    expect(changes).toEqual([]);
  });

  it("detects a real Date change", () => {
    const newDate = new Date("2026-02-01T09:30:00.000Z");
    const changes = diffFields(base, { cleanedAt: newDate }, FIELDS);
    expect(changes).toEqual([
      { field: "cleanedAt", oldValue: "2026-01-01T10:00:00.000Z", newValue: "2026-02-01T09:30:00.000Z" },
    ]);
  });

  it("captures a null -> value transition", () => {
    const changes = diffFields(base, { notes: "Verified after re-inspection." }, FIELDS);
    expect(changes).toEqual([{ field: "notes", oldValue: null, newValue: "Verified after re-inspection." }]);
  });

  it("captures a value -> null transition (clearing a field)", () => {
    const withNotes: Fixture = { ...base, notes: "some note" };
    const changes = diffFields(withNotes, { notes: null }, FIELDS);
    expect(changes).toEqual([{ field: "notes", oldValue: "some note", newValue: null }]);
  });

  it("reports multiple changed fields in the same call", () => {
    const changes = diffFields(base, { status: "VERIFIED", method: "CIP" }, FIELDS);
    expect(changes).toHaveLength(2);
    expect(changes.map((c) => c.field).sort()).toEqual(["method", "status"]);
  });
});

describe("diffForCreate", () => {
  it("records every populated field as an old=null -> new=value change", () => {
    const changes = diffForCreate(base, FIELDS);
    expect(changes).toContainEqual({ field: "cleanedBy", oldValue: null, newValue: "A. Sharma" });
    expect(changes).toContainEqual({ field: "status", oldValue: null, newValue: "PENDING" });
  });

  it("skips fields that were never populated", () => {
    const changes = diffForCreate(base, FIELDS);
    expect(changes.find((c) => c.field === "notes")).toBeUndefined();
  });
});

describe("normalizeValue", () => {
  it("normalizes null and undefined to null", () => {
    expect(normalizeValue(null)).toBeNull();
    expect(normalizeValue(undefined)).toBeNull();
  });

  it("normalizes a Date to its ISO string", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    expect(normalizeValue(date)).toBe("2026-01-01T00:00:00.000Z");
  });

  it("stringifies everything else", () => {
    expect(normalizeValue("VERIFIED")).toBe("VERIFIED");
  });
});
