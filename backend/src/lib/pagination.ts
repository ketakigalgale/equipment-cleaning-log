export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toPositiveInt(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    return fallback;
  }
  return n;
}

/**
 * Parses raw (string) query params into safe, bounded pagination inputs.
 * Anything malformed (non-numeric, negative, non-integer) silently falls
 * back to the default rather than erroring, since pagination params are
 * a UX convenience, not something worth 400-ing a list request over.
 */
export function parsePaginationParams(query: { page?: unknown; limit?: unknown }): PaginationParams {
  const page = toPositiveInt(query.page, DEFAULT_PAGE);
  const limit = Math.min(toPositiveInt(query.limit, DEFAULT_LIMIT), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { page, limit, total, totalPages };
}
