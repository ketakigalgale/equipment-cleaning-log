import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { AuditTrail } from "../components/AuditTrail";
import { CleaningRecordForm } from "../components/CleaningRecordForm";
import { CleaningRecordsTable } from "../components/CleaningRecordsTable";
import { EquipmentForm } from "../components/EquipmentForm";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import { useActor } from "../context/ActorContext";
import { CleaningRecord, CleaningRecordFormInput, CleaningStatus, Equipment, PaginationMeta } from "../types";

const PAGE_SIZE = 5;

interface EquipmentDetailPageProps {
  equipment: Equipment;
  onEquipmentUpdated: (equipment: Equipment) => void;
}

type FormMode = "closed" | "create" | CleaningRecord;

export function EquipmentDetailPage({ equipment, onEquipmentUpdated }: EquipmentDetailPageProps) {
  const { actor } = useActor();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<CleaningStatus | "">("");
  const [records, setRecords] = useState<CleaningRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [auditRecordId, setAuditRecordId] = useState<string | null>(null);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);

  useEffect(() => {
    setPage(1);
    setAuditRecordId(null);
    setFormMode("closed");
  }, [equipment.id]);

  const refetchRecords = () => {
    setLoading(true);
    setError(null);
    api
      .listCleaningRecords(equipment.id, { page, limit: PAGE_SIZE, status: statusFilter || undefined })
      .then((res) => {
        setRecords(res.data);
        setPagination(res.pagination);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load cleaning records"))
      .finally(() => setLoading(false));
  };

  useEffect(refetchRecords, [equipment.id, page, statusFilter]);

  const handleRecordSubmit = async (input: CleaningRecordFormInput) => {
    if (formMode === "create") {
      await api.createCleaningRecord(equipment.id, input, actor);
    } else if (formMode !== "closed") {
      await api.updateCleaningRecord(formMode.id, input, actor);
    }
    setFormMode("closed");
    refetchRecords();
  };

  const handleEquipmentSubmit = async (input: { name: string; code: string; status?: Equipment["status"] }) => {
    const res = await api.updateEquipment(equipment.id, input, actor);
    setShowEquipmentForm(false);
    onEquipmentUpdated(res.data);
  };

  return (
    <div className="equipment-detail-page">
      <div className="panel-header">
        <div>
          <h2>
            {equipment.name} <span className="equipment-code">({equipment.code})</span>
          </h2>
          <StatusBadge status={equipment.status} />
        </div>
        <button type="button" onClick={() => setShowEquipmentForm((v) => !v)}>
          {showEquipmentForm ? "Close" : "Edit equipment"}
        </button>
      </div>

      {showEquipmentForm && (
        <EquipmentForm initial={equipment} onSubmit={handleEquipmentSubmit} onCancel={() => setShowEquipmentForm(false)} />
      )}

      <div className="panel-header">
        <h3>Cleaning records</h3>
        <div className="toolbar">
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CleaningStatus | "");
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </label>
          <button type="button" onClick={() => setFormMode(formMode === "create" ? "closed" : "create")}>
            {formMode === "create" ? "Close" : "New cleaning record"}
          </button>
        </div>
      </div>

      {formMode !== "closed" && (
        <CleaningRecordForm
          initial={formMode === "create" ? null : formMode}
          defaultCleanedBy={actor}
          onSubmit={handleRecordSubmit}
          onCancel={() => setFormMode("closed")}
        />
      )}

      {error && <p className="error-text">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && !error && (
        <>
          <CleaningRecordsTable
            records={records}
            onEdit={(record) => setFormMode(record)}
            onViewAudit={(record) => setAuditRecordId(record.id === auditRecordId ? null : record.id)}
            selectedAuditRecordId={auditRecordId}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {auditRecordId && (
        <div className="audit-panel">
          <div className="panel-header">
            <h3>Audit trail</h3>
            <button type="button" onClick={() => setAuditRecordId(null)}>
              Close
            </button>
          </div>
          <AuditTrail cleaningRecordId={auditRecordId} />
        </div>
      )}
    </div>
  );
}
