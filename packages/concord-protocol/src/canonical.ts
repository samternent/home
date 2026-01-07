/**
 * Canonical JSON serialization for Concord Protocol.
 * - Object keys sorted lexicographically.
 * - Arrays preserved in order.
 * - No whitespace outside JSON structural characters.
 * - Rejects undefined, functions, symbols, bigint values, and non-finite numbers.
 * - Does not honor toJSON; inputs must be plain JSON values.
 */
export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value, new WeakSet()));
}

type CanonicalPrimitive = string | number | boolean | null;

interface CanonicalObject {
  [key: string]: CanonicalValue;
}

interface CanonicalArray extends Array<CanonicalValue> {}

type CanonicalValue = CanonicalPrimitive | CanonicalObject | CanonicalArray;

function canonicalize(
  value: unknown,
  seen: WeakSet<object>
): CanonicalValue {
  if (value === undefined) {
    throw new TypeError("Cannot canonicalize undefined");
  }
  const valueType = typeof value;
  if (valueType === "function" || valueType === "symbol") {
    throw new TypeError(`Cannot canonicalize ${valueType} values`);
  }
  if (valueType === "bigint") {
    throw new TypeError("Cannot canonicalize bigint values");
  }
  if (valueType === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Cannot canonicalize non-finite number");
    }
    return value as CanonicalValue;
  }
  if (value === null || valueType === "string" || valueType === "boolean") {
    return value as CanonicalValue;
  }

  if (typeof (value as { toJSON?: () => unknown }).toJSON === "function") {
    throw new TypeError("Cannot canonicalize toJSON values");
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value as object)) {
      throw new TypeError("Cannot canonicalize circular references");
    }
    seen.add(value as object);
    const entries = Object.keys(value as Record<string, unknown>).sort();
    const result: Record<string, CanonicalValue> = {};
    for (const key of entries) {
      result[key] = canonicalize(
        (value as Record<string, unknown>)[key],
        seen
      );
    }
    seen.delete(value as object);
    return result;
  }

  throw new TypeError(`Cannot canonicalize unsupported value type: ${valueType}`);
}
