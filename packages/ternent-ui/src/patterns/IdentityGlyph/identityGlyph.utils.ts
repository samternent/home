import type {
  IdentityGlyphAlgorithm,
  IdentityGlyphInput,
  IdentityGlyphModel,
  IdentityGlyphPalette,
  IdentityGlyphSize,
  ResolvedIdentityGlyphInput,
} from "./identityGlyph.types";

const GRID_SIZE = 7;
const CENTER_INDEX = Math.floor(GRID_SIZE / 2);
const FALLBACK_CANONICAL_IDENTITY = "fallback:glyph:v1";
const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);
const ED25519_PUBLIC_KEY_BYTES = 32;
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_LOOKUP = new Map(
  Array.from(BASE58_ALPHABET).map((char, index) => [char, index]),
);

type Rgb = {
  r: number;
  g: number;
  b: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBase64Url(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = normalizeBase64Url(value);
  if (!normalized) {
    throw new Error("Base64url value is required.");
  }

  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const base64 = `${normalized.replace(/-/g, "+").replace(/_/g, "/")}${pad}`;

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  if (typeof atob === "undefined") {
    throw new Error("Base64url decode is unavailable in this runtime.");
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  if (typeof btoa === "undefined") {
    throw new Error("Base64url encode is unavailable in this runtime.");
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase58(input: string): Uint8Array {
  const value = String(input || "").trim();
  if (!value) {
    throw new Error("Base58 payload is required.");
  }

  let numeric = 0n;
  for (const character of value) {
    const digit = BASE58_LOOKUP.get(character);
    if (digit === undefined) {
      throw new Error(`Invalid base58 character '${character}'.`);
    }
    numeric = numeric * 58n + BigInt(digit);
  }

  const bytes: number[] = [];
  while (numeric > 0n) {
    bytes.push(Number(numeric % 256n));
    numeric /= 256n;
  }
  bytes.reverse();

  let leadingZeros = 0;
  for (const character of value) {
    if (character !== "1") {
      break;
    }
    leadingZeros += 1;
  }

  return new Uint8Array([...new Array(leadingZeros).fill(0), ...bytes]);
}

function resolvePublicKeyCanonical(publicKey: string): string {
  const normalized = normalizeBase64Url(publicKey);
  const bytes = decodeBase64Url(normalized);
  if (bytes.length !== ED25519_PUBLIC_KEY_BYTES) {
    throw new Error("Identity public key must be 32-byte Ed25519 base64url.");
  }
  return normalized;
}

function resolveDidKeyCanonical(identityKey: string): string {
  const value = String(identityKey || "").trim();
  if (!value.startsWith("did:key:z")) {
    throw new Error("Identity key must be a did:key:z value.");
  }

  const decoded = decodeBase58(value.slice("did:key:z".length));
  if (decoded.length !== ED25519_MULTICODEC_PREFIX.length + ED25519_PUBLIC_KEY_BYTES) {
    throw new Error("Identity key must decode to Ed25519 multicodec bytes.");
  }

  const prefix = decoded.slice(0, ED25519_MULTICODEC_PREFIX.length);
  if (prefix[0] !== ED25519_MULTICODEC_PREFIX[0] || prefix[1] !== ED25519_MULTICODEC_PREFIX[1]) {
    throw new Error("Identity key multicodec prefix is not Ed25519.");
  }

  return encodeBase64Url(decoded.slice(ED25519_MULTICODEC_PREFIX.length));
}

function resolveCanonicalFromUnknown(value: unknown): string {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error("Identity value is required.");
    }

    if (normalized.startsWith("did:key:z")) {
      return resolveDidKeyCanonical(normalized);
    }

    return resolvePublicKeyCanonical(normalized);
  }

  if (!isRecord(value)) {
    throw new Error("Identity value is unsupported.");
  }

  if ("identity" in value) {
    return resolveCanonicalFromUnknown(value.identity);
  }

  if (typeof value.publicKey === "string") {
    return resolvePublicKeyCanonical(value.publicKey);
  }

  if (typeof value.identityKey === "string") {
    return resolveDidKeyCanonical(value.identityKey);
  }

  throw new Error("Identity object is missing public key material.");
}

function shortIdentity(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "unknown";
  }

  if (normalized.length <= 16) {
    return normalized;
  }

  return `${normalized.slice(0, 8)}...${normalized.slice(-6)}`;
}

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function createPrng(seed: number): () => number {
  let state = (seed >>> 0) || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r = 0;
  let g = 0;
  let b = 0;

  if (hp >= 0 && hp < 1) {
    r = c;
    g = x;
  } else if (hp < 2) {
    r = x;
    g = c;
  } else if (hp < 3) {
    g = c;
    b = x;
  } else if (hp < 4) {
    g = x;
    b = c;
  } else if (hp < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = light - c / 2;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHex(value: Rgb): string {
  const toHex = (channel: number) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0");
  return `#${toHex(value.r)}${toHex(value.g)}${toHex(value.b)}`;
}

function channelToLinear(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function contrastRatio(first: Rgb, second: Rgb): number {
  const luminanceA =
    0.2126 * channelToLinear(first.r) +
    0.7152 * channelToLinear(first.g) +
    0.0722 * channelToLinear(first.b);
  const luminanceB =
    0.2126 * channelToLinear(second.r) +
    0.7152 * channelToLinear(second.g) +
    0.0722 * channelToLinear(second.b);

  const light = Math.max(luminanceA, luminanceB);
  const dark = Math.min(luminanceA, luminanceB);
  return (light + 0.05) / (dark + 0.05);
}

function tuneContrast(
  background: Rgb,
  h: number,
  s: number,
  l: number,
  minRatio = 3,
): Rgb {
  let best = hslToRgb(h, s, l);
  if (contrastRatio(background, best) >= minRatio) {
    return best;
  }

  let bestRatio = contrastRatio(background, best);
  for (let delta = 4; delta <= 52; delta += 4) {
    const darker = hslToRgb(h, s, Math.max(8, l - delta));
    const darkerRatio = contrastRatio(background, darker);
    if (darkerRatio > bestRatio) {
      best = darker;
      bestRatio = darkerRatio;
    }
    if (darkerRatio >= minRatio) {
      return darker;
    }

    const lighter = hslToRgb(h, s, Math.min(92, l + delta));
    const lighterRatio = contrastRatio(background, lighter);
    if (lighterRatio > bestRatio) {
      best = lighter;
      bestRatio = lighterRatio;
    }
    if (lighterRatio >= minRatio) {
      return lighter;
    }
  }

  return best;
}

function createPalette(seed: number): IdentityGlyphPalette {
  const random = createPrng(seed ^ 0xa5a5a5a5);

  const baseHue = Math.floor(random() * 360);
  const background = hslToRgb(baseHue, 22 + random() * 10, 86 + random() * 7);

  const primaryHue = (baseHue + 130 + random() * 70) % 360;
  const secondaryHue = (baseHue + 30 + random() * 120) % 360;
  const accentHue = (primaryHue + 170 + random() * 25) % 360;

  const primary = tuneContrast(background, primaryHue, 68 + random() * 18, 30 + random() * 12, 3.4);
  const secondary = tuneContrast(background, secondaryHue, 58 + random() * 20, 36 + random() * 14, 2.8);
  const accent = tuneContrast(background, accentHue, 76 + random() * 16, 44 + random() * 14, 3.1);

  return {
    background: rgbToHex(background),
    primary: rgbToHex(primary),
    secondary: rgbToHex(secondary),
    accent: rgbToHex(accent),
  };
}

function createGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => new Array(GRID_SIZE).fill(0));
}

function setSymmetricCell(grid: number[][], x: number, y: number, value: number): void {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
    return;
  }

  grid[y][x] = value;
  grid[y][GRID_SIZE - 1 - x] = value;
}

function countFilled(grid: number[][]): number {
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell !== 0) {
        total += 1;
      }
    }
  }
  return total;
}

function centerCoreFilled(grid: number[][]): number {
  const positions = [
    [CENTER_INDEX, CENTER_INDEX],
    [CENTER_INDEX, CENTER_INDEX - 1],
    [CENTER_INDEX, CENTER_INDEX + 1],
    [CENTER_INDEX - 1, CENTER_INDEX],
    [CENTER_INDEX + 1, CENTER_INDEX],
  ] as const;

  return positions.reduce((count, [x, y]) => count + (grid[y][x] === 0 ? 0 : 1), 0);
}

function buildFallbackGrid(): number[][] {
  const grid = createGrid();

  for (let y = 1; y <= 5; y += 1) {
    setSymmetricCell(grid, CENTER_INDEX, y, 1);
  }

  for (let x = 1; x <= CENTER_INDEX; x += 1) {
    setSymmetricCell(grid, x, CENTER_INDEX, 2);
  }

  setSymmetricCell(grid, 2, 2, 1);
  setSymmetricCell(grid, 2, 4, 1);
  setSymmetricCell(grid, CENTER_INDEX, CENTER_INDEX, 3);

  return grid;
}

function buildGlyphGrid(seed: number): number[][] {
  const random = createPrng(seed);
  const grid = createGrid();

  // Base silhouette with clear center of gravity.
  for (let y = 1; y <= 5; y += 1) {
    setSymmetricCell(grid, CENTER_INDEX, y, 1);
  }
  for (let x = 1; x <= CENTER_INDEX; x += 1) {
    setSymmetricCell(grid, x, CENTER_INDEX, 1);
  }
  setSymmetricCell(grid, 2, 2, 1);
  setSymmetricCell(grid, 2, 4, 1);

  const silhouetteCandidates = [
    [1, 2],
    [1, 4],
    [2, 1],
    [2, 5],
    [3, 1],
    [3, 5],
    [2, 3],
  ] as const;

  for (const [x, y] of silhouetteCandidates) {
    if (random() > 0.45) {
      setSymmetricCell(grid, x, y, 1);
    }
  }

  // Landmarks.
  const landmarkCandidates = [
    [1, 1],
    [1, 3],
    [1, 5],
    [2, 2],
    [2, 3],
    [2, 4],
    [3, 2],
    [3, 4],
    [3, 5],
    [0, 3],
  ] as const;

  for (const [x, y] of landmarkCandidates) {
    if (random() > 0.52) {
      setSymmetricCell(grid, x, y, 2);
    }
  }

  // Optional cuts in interior zones.
  const cutCandidates = [
    [2, 2],
    [2, 3],
    [2, 4],
    [3, 2],
    [3, 4],
  ] as const;

  for (const [x, y] of cutCandidates) {
    if (random() > 0.82 && !(x === CENTER_INDEX && y === CENTER_INDEX)) {
      setSymmetricCell(grid, x, y, 0);
    }
  }

  // Rare accents.
  let accentCount = 0;
  const accentCandidates = [
    [1, 1],
    [1, 5],
    [2, 2],
    [2, 4],
    [3, 3],
    [3, 1],
    [3, 5],
  ] as const;

  for (const [x, y] of accentCandidates) {
    if (accentCount >= 2) {
      break;
    }
    if (grid[y][x] !== 0 && random() > 0.9) {
      setSymmetricCell(grid, x, y, 3);
      accentCount += 1;
    }
  }

  // Guarantees: center core and minimum density.
  const centerFillTargets = [
    [CENTER_INDEX, CENTER_INDEX],
    [CENTER_INDEX, CENTER_INDEX - 1],
    [CENTER_INDEX, CENTER_INDEX + 1],
    [CENTER_INDEX - 1, CENTER_INDEX],
    [CENTER_INDEX - 1, CENTER_INDEX - 1],
    [CENTER_INDEX - 1, CENTER_INDEX + 1],
  ] as const;

  for (const [x, y] of centerFillTargets) {
    if (centerCoreFilled(grid) >= 4) {
      break;
    }
    if (grid[y][x] === 0) {
      setSymmetricCell(grid, x, y, 1);
    }
  }

  const minFilled = 16;
  const densityCandidates = [
    [1, 2],
    [1, 4],
    [0, 3],
    [2, 1],
    [2, 5],
    [3, 1],
    [3, 5],
    [0, 2],
    [0, 4],
  ] as const;

  for (const [x, y] of densityCandidates) {
    if (countFilled(grid) >= minFilled) {
      break;
    }
    if (grid[y][x] === 0) {
      setSymmetricCell(grid, x, y, 1);
    }
  }

  return grid;
}

function buildModel(
  resolved: ResolvedIdentityGlyphInput,
  algorithm: IdentityGlyphAlgorithm,
): IdentityGlyphModel {
  const paletteSeed = fnv1aHash(`${algorithm}|palette|${resolved.canonicalIdentity}`);

  if (resolved.fallback) {
    return {
      algorithm,
      canonicalIdentity: resolved.canonicalIdentity,
      shortIdentity: resolved.shortIdentity,
      fallback: true,
      grid: buildFallbackGrid(),
      palette: createPalette(paletteSeed ^ 0x41424344),
    };
  }

  const seed = fnv1aHash(`${algorithm}|grid|${resolved.canonicalIdentity}`);
  return {
    algorithm,
    canonicalIdentity: resolved.canonicalIdentity,
    shortIdentity: resolved.shortIdentity,
    fallback: false,
    grid: buildGlyphGrid(seed),
    palette: createPalette(paletteSeed),
  };
}

export function resolveIdentityGlyphSize(size?: number | IdentityGlyphSize): number {
  if (typeof size === "number" && Number.isFinite(size)) {
    return Math.max(16, Math.round(size));
  }

  if (size === "xs") return 24;
  if (size === "sm") return 32;
  if (size === "md") return 40;
  if (size === "lg") return 48;
  return 32;
}

export function resolveIdentityGlyphInput(
  input: IdentityGlyphInput,
): ResolvedIdentityGlyphInput {
  try {
    const canonicalIdentity = resolveCanonicalFromUnknown(input);
    return {
      canonicalIdentity,
      shortIdentity: shortIdentity(canonicalIdentity),
      fallback: false,
    };
  } catch {
    return {
      canonicalIdentity: FALLBACK_CANONICAL_IDENTITY,
      shortIdentity: "fallback",
      fallback: true,
    };
  }
}

export function createIdentityGlyphModel(
  input: IdentityGlyphInput,
  algorithm: IdentityGlyphAlgorithm = "glyph:v1",
): IdentityGlyphModel {
  return buildModel(resolveIdentityGlyphInput(input), algorithm);
}

export function getIdentityGlyphPaletteValues(palette: IdentityGlyphPalette): string[] {
  return [palette.background, palette.primary, palette.secondary, palette.accent];
}
