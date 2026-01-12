/**
 * addNewLines function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function addNewLines(str: string): string {
  let finalString = "";
  while (str.length > 0) {
    finalString += str.substring(0, 64) + "\n";
    str = str.substring(64);
  }

  return finalString;
}

/**
 * removeLines function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function removeLines(str: string): string {
  return str.replaceAll("\n", "");
}

/**
 * stripIdentityKey function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function stripIdentityKey(key: string) {
  return key
    .replace("-----BEGIN PUBLIC KEY-----\n", "")
    .replace("\n-----END PUBLIC KEY-----", "");
}

/**
 * formatIdentityKey function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function formatIdentityKey(key: string) {
  return `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
}

/**
 * stripEncryptionFile function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function stripEncryptionFile(file: string) {
  return file
    .replace("-----BEGIN AGE ENCRYPTED FILE-----\n", "")
    .replace("\n-----END AGE ENCRYPTED FILE-----\n", "");
}

/**
 * formatEncryptionFile function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function formatEncryptionFile(file: string) {
  return `-----BEGIN AGE ENCRYPTED FILE-----\n${file}\n-----END AGE ENCRYPTED FILE-----\n`;
}

/**
 * generateId function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function generateId() {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  return uint32.toString(16);
}

/**
 * arrayBufferToBase64 function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(arrayBuffer);
  let byteString = "";
  for (let i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  return window.btoa(byteString);
}

/**
 * base64ToArrayBuffer function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const byteString = window.atob(b64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return byteArray;
}

/**
 * b64encode function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function b64encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * b64decode function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function b64decode(str: string): ArrayBuffer {
  const binary_string = window.atob(str);
  const len = binary_string.length;
  const bytes = new Uint8Array(new ArrayBuffer(len));
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// Encode JSON object to UTF-8 Buffer
/**
 * encode function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function encode(data: string | object | number): Uint8Array {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return new TextEncoder().encode(payload);
}

/**
 * decode function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function decode(data: Uint8Array): string {
  return new TextDecoder("utf-8").decode(new Uint8Array(data));
}

/**
 * getHashBuffer function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function getHashBuffer(
  data: string | object | number
): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", encode(data));
}

/**
 * getHashArray function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function getHashArray(hash: ArrayBuffer): Array<number> {
  return Array.from(new Uint8Array(hash));
}

/**
 * getHashHex function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function getHashHex(hash: Array<number>): string {
  return hash.map((buf) => buf.toString(16).padStart(2, "0")).join("");
}

function canonicalize(
  value: unknown,
  seen: WeakSet<object>
): string | number | boolean | null | Array<unknown> | Record<string, unknown> {
  if (value === undefined) {
    throw new TypeError("Cannot hash undefined");
  }
  const valueType = typeof value;
  if (valueType === "function" || valueType === "symbol") {
    throw new TypeError(`Cannot hash ${valueType} values`);
  }
  if (
    value === null ||
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return value as string | number | boolean | null;
  }
  if (valueType === "bigint") {
    throw new TypeError("Cannot hash bigint values");
  }

  if (typeof (value as { toJSON?: () => unknown }).toJSON === "function") {
    return canonicalize((value as { toJSON: () => unknown }).toJSON(), seen);
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item, seen));
  }

  if (typeof value === "object") {
    if (seen.has(value as object)) {
      throw new TypeError("Cannot hash circular references");
    }
    seen.add(value as object);
    const entries = Object.keys(value as Record<string, unknown>).sort();
    const result: Record<string, unknown> = {};
    for (const key of entries) {
      result[key] = canonicalize((value as Record<string, unknown>)[key], seen);
    }
    seen.delete(value as object);
    return result;
  }

  throw new TypeError(`Cannot hash unsupported value type: ${valueType}`);
}

export function canonicalStringify(data: string | object | number): string {
  return JSON.stringify(canonicalize(data, new WeakSet()));
}

export async function hashData(
  data: string | object | number
): Promise<string> {
  const hash_buffer = await getHashBuffer(canonicalStringify(data));
  const hash_array = getHashArray(hash_buffer);
  return getHashHex(hash_array);
}

// utils/gradientUtils.js
/**
 * generateColorStops function - TODO: Add description
 * @param TODO - Add parameters
 * @returns TODO - Add return type description
 */
export function generateColorStops(
  primaryColor: string,
  secondaryColor: string,
  steps: number
) {
  const colors = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const color = lerpColor(primaryColor, secondaryColor, ratio);
    colors.push(color);
  }
  return colors;
}

function lerpColor(color1: string, color2: string, ratio: number) {
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);
  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${((1 << 24) | (r << 16) | (g << 8) | b)
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}
