export function addNewLines(str: string): string {
  let finalString = "";
  while (str.length > 0) {
    finalString += str.substring(0, 64) + "\n";
    str = str.substring(64);
  }

  return finalString;
}

export function removeLines(str: string): string {
  return str.replace("\n", "");
}

export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(arrayBuffer);
  let byteString = "";
  for (let i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  return window.btoa(byteString);
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const byteString = window.atob(b64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return byteArray;
}

export function b64encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

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
export function encode(data: string | object | number): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data));
}

export function decode(data: Uint8Array): string {
  return new TextDecoder("utf-8").decode(new Uint8Array(data));
}

export function getHashBuffer(
  data: string | object | number
): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", encode(data));
}

export function getHashArray(hash: ArrayBuffer): Array<number> {
  return Array.from(new Uint8Array(hash));
}

export function getHashHex(hash: Array<number>): string {
  return hash.map((buf) => buf.toString(16)).join("");
}

export async function hashData(
  data: string | object | number
): Promise<string> {
  const hash_buffer = await getHashBuffer(data);
  const hash_array = getHashArray(hash_buffer);
  return getHashHex(hash_array);
}
