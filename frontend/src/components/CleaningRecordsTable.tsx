import { CleaningRecord } from "../types";
import { StatusBadge } from "./StatusBadge";

interface CleaningRecordsTableProps {
  records: CleaningRecord[];
  onEdit: (record: CleaningRecord) => void;
  onViewAudit: (record: CleaningRecord) => void;
  selectedAuditRecordId: string | null;
}

export function CleaningRecordsTable({ records, onEdit, onViewAudit, selectedAuditRecordId }: CleaningRecordsTableProps) {
  if (records.length === 0) {
    return <p className="empty-state">No cleaning records for this filter yet.</p>;
  }

  return (
    <table className="records-table">
      <thead>
        <tr>
          <th>Cleaned at</th>
          <th>Cleaned by</th>
          <th>Method</th>
          <th>Notes</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={record.id} className={record.id === selectedAuditRecordId ? "row-selected" : undefined}>
            <td>{new Date(record.cleanedAt).toLocaleString()}</td>
            <td>{record.cleanedBy}</td>
            <td>{record.method}</td>
            <td>{record.notes ?? <em>-</em>}</td>
            <td>
              <StatusBadge status={record.status} />
            </td>
            <td className="row-actions">
              <button type="button" onClick={() => onEdit(record)}>
                Edit
              </button>
              <button type="button" onClick={() => onViewAudit(record)}>
                Audit trail
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
