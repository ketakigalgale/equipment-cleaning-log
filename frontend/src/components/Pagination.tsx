import { PaginationMeta } from "../types";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = pagination;

  return (
    <div className="pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="pagination-label">
        Page {Math.max(page, 1)} of {Math.max(totalPages, 1)} &middot; {total} record{total === 1 ? "" : "s"}
      </span>
      <button type="button" disabled={totalPages === 0 || page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
