import { FormEvent, useState } from "react";
import { CreateEquipmentInput } from "../api/client";
import { Equipment, EquipmentStatus } from "../types";

interface EquipmentFormProps {
  initial: Equipment | null;
  onSubmit: (input: CreateEquipmentInput) => Promise<void>;
  onCancel: () => void;
}

export function EquipmentForm({ initial, onSubmit, onCancel }: EquipmentFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState<EquipmentStatus>(initial?.status ?? "ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !code.trim()) {
      setError("Name and code are required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), code: code.trim(), status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save equipment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="equipment-form" onSubmit={handleSubmit}>
      <h3>{initial ? "Edit equipment" : "New equipment"}</h3>

      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>

      <label>
        Code
        <input value={code} onChange={(e) => setCode(e.target.value)} required />
      </label>

      {initial && (
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as EquipmentStatus)}>
            <option value="ACTIVE">Active</option>
            <option value="RETIRED">Retired</option>
          </select>
        </label>
      )}

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
