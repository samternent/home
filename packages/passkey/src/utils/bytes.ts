export function toUint8Array(input: Uint8Array | ArrayBuffer): Uint8Array {
  if (input instanceof Uint8Array) {
    return input;
  }
  return new Uint8Array(input);
}

export function toArrayBuffer(input: Uint8Array | ArrayBuffer): ArrayBuffer {
  if (input instanceof ArrayBuffer) {
    return input.slice(0);
  }
  return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
}

export function concatBytes(...parts: Array<Uint8Array | ArrayBuffer>): Uint8Array {
  const normalized = parts.map((part) => toUint8Array(part));
  const total = normalized.reduce((sum, bytes) => sum + bytes.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const bytes of normalized) {
    output.set(bytes, offset);
    offset += bytes.byteLength;
  }

  return output;
}

export function randomBytes(length: number): Uint8Array {
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Web Crypto random source is unavailable.");
  }
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

export function equalBytes(left: Uint8Array | ArrayBuffer, right: Uint8Array | ArrayBuffer): boolean {
  const a = toUint8Array(left);
  const b = toUint8Array(right);
  if (a.byteLength !== b.byteLength) {
    return false;
  }

  for (let i = 0; i < a.byteLength; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
