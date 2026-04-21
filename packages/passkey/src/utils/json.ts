function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortKeys(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    next[key] = sortKeys(record[key]);
  }
  return next;
}

export function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
