import { canonicalStringify } from "@ternent/concord-protocol";

const SNAPSHOT_FORMAT = "pixpax-ledger-snapshot";
const SNAPSHOT_VERSION = "1.0";

function trim(value) {
  return String(value || "").trim();
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toCanonicalJson(value, fallback = {}) {
  try {
    return JSON.parse(canonicalStringify(value ?? fallback));
  } catch {
    return JSON.parse(JSON.stringify(value ?? fallback));
  }
}

function isLikelyLedger(value) {
  if (!isObject(value)) return false;
  const format = trim(value.format).toLowerCase();
  if (format === "concord-ledger") return true;
  if (isObject(value.commits) || isObject(value.entries)) return true;
  if (typeof value.head === "string") return true;
  return false;
}

function resolveLedgerCandidate(input) {
  if (!isObject(input)) return null;

  const normalizedFormat = trim(input.format).toLowerCase();
  if (
    (normalizedFormat === "pixpax-pixbook" || normalizedFormat === SNAPSHOT_FORMAT) &&
    isLikelyLedger(input.ledger)
  ) {
    return input.ledger;
  }

  if (isLikelyLedger(input.ledger)) {
    return input.ledger;
  }

  if (isObject(input.snapshot)) {
    return resolveLedgerCandidate(input.snapshot);
  }

  if (isObject(input.payload)) {
    return resolveLedgerCandidate(input.payload);
  }

  if (isLikelyLedger(input)) {
    return input;
  }

  return null;
}

function canNormalizeSnapshot(value) {
  if (!isObject(value)) return false;
  if (isLikelyLedger(value.ledger)) return true;
  const format = trim(value.format).toLowerCase();
  if (format === "pixpax-pixbook" || format === SNAPSHOT_FORMAT) return true;
  if (isObject(value.snapshot) || isObject(value.payload)) return true;
  return isLikelyLedger(value);
}

export function sanitizePixbookSnapshotPayload(input) {
  const ledger = resolveLedgerCandidate(input);
  if (!ledger) return null;
  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    ledger: toCanonicalJson(ledger, {}),
  };
}

export function sanitizeReceiptSnapshotPayloads(receipt) {
  if (!isObject(receipt)) return receipt ?? null;
  const next = toCanonicalJson(receipt, {});
  if (!isObject(next.payload)) return next;

  if (canNormalizeSnapshot(next.payload.snapshot)) {
    const sanitized = sanitizePixbookSnapshotPayload(next.payload.snapshot);
    if (sanitized) next.payload.snapshot = sanitized;
  }
  if (canNormalizeSnapshot(next.payload.payload)) {
    const sanitized = sanitizePixbookSnapshotPayload(next.payload.payload);
    if (sanitized) next.payload.payload = sanitized;
  }
  if (
    trim(next.type).toUpperCase() === "PIXBOOK_SAVE" &&
    !Object.prototype.hasOwnProperty.call(next.payload, "snapshot") &&
    !Object.prototype.hasOwnProperty.call(next.payload, "clientLedgerHead") &&
    canNormalizeSnapshot(next.payload)
  ) {
    const sanitized = sanitizePixbookSnapshotPayload(next.payload);
    if (sanitized) next.payload = sanitized;
  }
  if (isObject(next.payload.profile)) {
    delete next.payload.profile;
  }

  return next;
}
