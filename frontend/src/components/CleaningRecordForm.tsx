import { FormEvent, useState } from "react";
import { CleaningRecord, CleaningRecordFormInput, CleaningStatus } from "../types";

interface CleaningRecordFormProps {
  initial: CleaningRecord | null;
  defaultCleanedBy: string;
  onSubmit: (input: CleaningRecordFormInput) => Promise<void>;
  onCancel: () => void;
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CleaningRecordForm({ initial, defaultCleanedBy, onSubmit, onCancel }: CleaningRecordFormProps) {
  const [cleanedBy, setCleanedBy] = useState(initial?.cleanedBy ?? defaultCleanedBy);
  const [cleanedAt, setCleanedAt] = useState(initial ? toDatetimeLocalValue(initial.cleanedAt) : toDatetimeLocalValue(new Date().toISOString()));
  const [method, setMethod] = useState(initial?.method ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<CleaningStatus>(initial?.status ?? "PENDING");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cleanedBy.trim() || !method.trim() || !cleanedAt) {
      setError("Cleaned by, cleaned at, and method are required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        cleanedBy: cleanedBy.trim(),
        cleanedAt: new Date(cleanedAt).toISOString(),
        method: method.trim(),
        notes: notes.trim() ? notes.trim() : null,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save cleaning record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="record-form" onSubmit={handleSubmit}>
      <h3>{initial ? "Edit cleaning record" : "New cleaning record"}</h3>

      <label>
        Cleaned by
        <input value={cleanedBy} onChange={(e) => setCleanedBy(e.target.value)} required />
      </label>

      <label>
        Cleaned at
        <input type="datetime-local" value={cleanedAt} onChange={(e) => setCleanedAt(e.target.value)} required />
      </label>

      <label>
        Method
        <input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="e.g. Wet cleaning (WFI rinse)" required />
      </label>

      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </label>

      <label>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value as CleaningStatus)}>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
        </select>
      </label>

      {error && <p className="error-text">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
