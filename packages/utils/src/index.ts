export function addNewLines(str) {
  var finalString = "";
  while (str.length > 0) {
    finalString += str.substring(0, 64) + "\n";
    str = str.substring(64);
  }

  return finalString;
}

export function removeLines(str) {
  return str.replace("\n", "");
}

export function arrayBufferToBase64(arrayBuffer) {
  var byteArray = new Uint8Array(arrayBuffer);
  var byteString = "";
  for (var i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  var b64 = window.btoa(byteString);

  return b64;
}

export function base64ToArrayBuffer(b64) {
  var byteString = window.atob(b64);
  var byteArray = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return byteArray;
}

export function b64encode(buf) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
}

export function b64decode(str) {
  var binary_string = window.atob(str);
  var len = binary_string.length;
  var bytes = new Uint8Array(new ArrayBuffer(len));
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// Encode JSON object to UTF-8 Buffer
export const encode = (data) => new TextEncoder().encode(JSON.stringify(data));

export const decode = (data) =>
  new TextDecoder("utf-8").decode(new Uint8Array(data));

export const getHashBuffer = (data) =>
  crypto.subtle.digest("SHA-256", encode(data));

export const getHashArray = (hash) => Array.from(new Uint8Array(hash));

export const getHashHex = (hash) =>
  hash.map((buf) => buf.toString(16)).join("");

export async function hashData(data) {
  const hash_buffer = await getHashBuffer(data);
  const hash_array = getHashArray(hash_buffer);
  return getHashHex(hash_array);
}
