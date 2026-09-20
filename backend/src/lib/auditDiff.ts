export interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

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
