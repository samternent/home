const SWAP_RECIPIENT_PREFIX = "pixpax-swap-recipient:";

function trim(value: string | null | undefined) {
  return String(value || "").trim();
}

export function createSwapRecipientPayload(publicKey: string) {
  const normalized = trim(publicKey);
  if (!normalized) {
    throw new Error("Recipient public key is required.");
  }
  return `${SWAP_RECIPIENT_PREFIX}${encodeURIComponent(normalized)}`;
}

export function parseSwapRecipientPayload(input: string) {
  const normalized = trim(input);
  if (!normalized) {
    throw new Error("Recipient public key is required.");
  }
  if (!normalized.startsWith(SWAP_RECIPIENT_PREFIX)) {
    return normalized;
  }
  const encoded = normalized.slice(SWAP_RECIPIENT_PREFIX.length);
  const decoded = trim(decodeURIComponent(encoded));
  if (!decoded) {
    throw new Error("Recipient public key is required.");
  }
  return decoded;
}

export function isSwapRecipientPayload(input: string) {
  return trim(input).startsWith(SWAP_RECIPIENT_PREFIX);
}
