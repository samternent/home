import { canonicalStringify } from "ternent-utils";

export const SEAL_MANIFEST_VERSION = "1" as const;
export const SEAL_MANIFEST_TYPE = "seal-manifest" as const;

export type SealHash = `sha256:${string}`;

export type SealManifestV1 = {
  version: typeof SEAL_MANIFEST_VERSION;
  type: typeof SEAL_MANIFEST_TYPE;
  root: string;
  files: Record<string, SealHash>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: string[]
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isSealHash(value: unknown): value is SealHash {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value);
}

export function validateSealManifestShape(value: unknown): {
  ok: boolean;
  errors: string[];
  manifest: SealManifestV1 | null;
} {
  if (!isRecord(value)) {
    return {
      ok: false,
      errors: ["Manifest must be a JSON object."],
      manifest: null,
    };
  }

  const errors: string[] = [];

  if (!hasOnlyKeys(value, ["version", "type", "root", "files"])) {
    errors.push("Manifest contains unsupported fields.");
  }

  if (value.version !== SEAL_MANIFEST_VERSION) {
    errors.push(`Manifest version must be ${SEAL_MANIFEST_VERSION}.`);
  }

  if (value.type !== SEAL_MANIFEST_TYPE) {
    errors.push(`Manifest type must be ${SEAL_MANIFEST_TYPE}.`);
  }

  if (typeof value.root !== "string" || value.root.length === 0) {
    errors.push("Manifest root must be a non-empty string.");
  }

  if (!isRecord(value.files)) {
    errors.push("Manifest files must be an object.");
  }

  if (errors.length > 0 || !isRecord(value.files)) {
    return { ok: false, errors, manifest: null };
  }

  const filesEntries = Object.entries(value.files);
  const files: Record<string, SealHash> = {};
  for (const [path, hash] of filesEntries) {
    if (!path || path.includes("\\")) {
      errors.push(`Manifest file path is invalid: ${path || "<empty>"}.`);
      continue;
    }
    if (!isSealHash(hash)) {
      errors.push(`Manifest file hash is invalid for ${path}.`);
      continue;
    }
    files[path] = hash;
  }

  if (errors.length > 0) {
    return { ok: false, errors, manifest: null };
  }

    return {
      ok: true,
      errors: [],
      manifest: {
        version: SEAL_MANIFEST_VERSION,
        type: SEAL_MANIFEST_TYPE,
        root: value.root as string,
        files,
      },
    };
}

export function parseSealManifestJson(raw: string): {
  ok: boolean;
  errors: string[];
  manifest: SealManifestV1 | null;
} {
  try {
    return validateSealManifestShape(JSON.parse(raw));
  } catch {
    return {
      ok: false,
      errors: ["Manifest JSON is not valid JSON."],
      manifest: null,
    };
  }
}

export function stringifySealManifest(manifest: SealManifestV1): string {
  return canonicalStringify(manifest);
}
