import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { AuditLogEntry } from "../types";

/**
 * Pure rendering of an already-fetched audit history. Split out from
 * AuditTrail so it can be unit-tested without mocking the network.
 */
export function AuditTrailTable({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="empty-state">No audit history yet.</p>;
  }

  return (
    <table className="audit-table">
      <thead>
        <tr>
          <th>When</th>
          <th>Who</th>
          <th>Action</th>
          <th>Field</th>
          <th>Old value</th>
          <th>New value</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{new Date(entry.changedAt).toLocaleString()}</td>
            <td>{entry.changedBy}</td>
            <td>{entry.action}</td>
            <td>{entry.field}</td>
            <td>{entry.oldValue ?? <em>(empty)</em>}</td>
            <td>{entry.newValue ?? <em>(empty)</em>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function AuditTrail({ cleaningRecordId }: { cleaningRecordId: string }) {
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setError(null);

    api
      .getAuditTrail(cleaningRecordId)
      .then((res) => {
        if (!cancelled) setEntries(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load audit trail");
      });

    return () => {
      cancelled = true;
    };
  }, [cleaningRecordId]);

  if (error) return <p className="error-text">{error}</p>;
  if (!entries) return <p>Loading audit trail...</p>;
  return <AuditTrailTable entries={entries} />;
}
