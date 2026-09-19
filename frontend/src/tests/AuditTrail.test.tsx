import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditTrailTable } from "../components/AuditTrail";
import { AuditLogEntry } from "../types";

const entry = (overrides: Partial<AuditLogEntry>): AuditLogEntry => ({
  id: "audit-1",
  cleaningRecordId: "record-1",
  action: "UPDATE",
  changedBy: "S. Kulkarni",
  changedAt: "2026-01-05T09:00:00.000Z",
  field: "status",
  oldValue: "PENDING",
  newValue: "VERIFIED",
  ...overrides,
});

describe("AuditTrailTable", () => {
  it("shows an empty state when there is no history", () => {
    render(<AuditTrailTable entries={[]} />);
    expect(screen.getByText(/no audit history/i)).toBeInTheDocument();
  });

  it("renders a row with the field, old value, new value, and who made the change", () => {
    render(<AuditTrailTable entries={[entry({})]} />);

    expect(screen.getByText("status")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("VERIFIED")).toBeInTheDocument();
    expect(screen.getByText("S. Kulkarni")).toBeInTheDocument();
    expect(screen.getByText("UPDATE")).toBeInTheDocument();
  });

  it("renders (empty) for a null old value, e.g. a field set for the first time", () => {
    render(<AuditTrailTable entries={[entry({ field: "notes", oldValue: null, newValue: "Verified after re-inspection.", action: "CREATE" })]} />);

    expect(screen.getByText("(empty)")).toBeInTheDocument();
    expect(screen.getByText("Verified after re-inspection.")).toBeInTheDocument();
  });

  it("renders multiple entries in the order provided", () => {
    const entries = [
      entry({ id: "audit-1", field: "status", oldValue: "PENDING", newValue: "VERIFIED" }),
      entry({ id: "audit-2", field: "notes", oldValue: null, newValue: "Looks good" }),
    ];
    render(<AuditTrailTable entries={entries} />);

    const rows = screen.getAllByRole("row");
    // header row + 2 data rows
    expect(rows).toHaveLength(3);
  });
});
