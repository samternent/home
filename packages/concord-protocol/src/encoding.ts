/**
 * Encode a string as UTF-8 bytes.
 */
export function utf8Bytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}
