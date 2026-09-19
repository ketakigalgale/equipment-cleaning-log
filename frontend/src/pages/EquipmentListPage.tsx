import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { EquipmentForm } from "../components/EquipmentForm";
import { StatusBadge } from "../components/StatusBadge";
import { useActor } from "../context/ActorContext";
import { Equipment, EquipmentStatus } from "../types";

interface EquipmentListPageProps {
  selectedId: string | null;
  onSelect: (equipment: Equipment) => void;
}

export function EquipmentListPage({ selectedId, onSelect }: EquipmentListPageProps) {
  const { actor } = useActor();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refetch = () => {
    setLoading(true);
    setError(null);
    api
      .listEquipment(statusFilter || undefined)
      .then((res) => setEquipment(res.data))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load equipment"))
      .finally(() => setLoading(false));
  };

  useEffect(refetch, [statusFilter]);

  const handleCreate = async (input: { name: string; code: string; status?: EquipmentStatus }) => {
    const res = await api.createEquipment(input, actor);
    setShowForm(false);
    refetch();
    onSelect(res.data);
  };

  return (
    <div className="equipment-list-page">
      <div className="panel-header">
        <h2>Equipment</h2>
        <button type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : "New equipment"}
        </button>
      </div>

      {showForm && <EquipmentForm initial={null} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

      <label className="filter-row">
        Status
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | "")}>
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="RETIRED">Retired</option>
        </select>
      </label>

      {error && <p className="error-text">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <ul className="equipment-list">
          {equipment.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`equipment-list-item ${item.id === selectedId ? "selected" : ""}`}
                onClick={() => onSelect(item)}
              >
                <span className="equipment-name">{item.name}</span>
                <span className="equipment-code">{item.code}</span>
                <StatusBadge status={item.status} />
              </button>
            </li>
          ))}
          {equipment.length === 0 && <p className="empty-state">No equipment yet.</p>}
        </ul>
      )}
    </div>
  );
}
