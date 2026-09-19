export interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

/**
 * Normalizes a field value to the flat string representation stored in
 * AuditLog.oldValue/newValue, so a Date and its ISO string compare equal
 * and null/undefined both mean "unset".
 */
export function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/**
 * Diffs `after` against `before` for a fixed set of trackable fields.
 * Only keys actually present on `after` are considered, so a partial
 * update payload (e.g. { status: "VERIFIED" }) never generates spurious
 * changes for fields the caller didn't touch.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  fields: ReadonlyArray<keyof T & string>,
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(after, field)) continue;

    const oldValue = normalizeValue(before[field]);
    const newValue = normalizeValue(after[field]);
    if (oldValue !== newValue) {
      changes.push({ field, oldValue, newValue });
    }
  }

  return changes;
}

/**
 * Builds the initial set of audit entries for a freshly created record.
 * Fields left unset (null/undefined) are skipped: there is no meaningful
 * "old -> new" for a value that was never provided.
 */
export function diffForCreate<T extends Record<string, unknown>>(
  created: T,
  fields: ReadonlyArray<keyof T & string>,
): FieldChange[] {
  const changes: FieldChange[] = [];

  for (const field of fields) {
    const newValue = normalizeValue(created[field]);
    if (newValue !== null) {
      changes.push({ field, oldValue: null, newValue });
    }
  }

  return changes;
}
