function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function hashToUnit(input: string) {
  return (hashString(input) % 1000000) / 1000000;
}

export function hashToRange(input: string, min: number, max: number) {
  return min + (max - min) * hashToUnit(input);
}

export function buildSparklePositions(seed: string, count = 6) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    points.push({
      x: hashToRange(`${seed}:x:${i}`, 20, 180),
      y: hashToRange(`${seed}:y:${i}`, 20, 180),
      r: hashToRange(`${seed}:r:${i}`, 3, 9),
    });
  }
  return points;
}

function toBase64Url(bytes: ArrayBuffer) {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function verifyPackToken(
  token: string,
  secret: string
): Promise<boolean> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  const expected = toBase64Url(signed);
  return expected === signature;
}

export function decodePackPayload(token: string) {
  const payload = token.split(".")[0];
  if (!payload) return null;
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = atob(padded);
  return JSON.parse(json);
}
