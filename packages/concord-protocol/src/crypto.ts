// Convert hash bytes to lowercase hex string.
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

type NodeCrypto = {
  createHash: (algorithm: string) => {
    update: (data: Uint8Array) => void;
    digest: (encoding: "hex") => string;
  };
};

function getNodeCrypto(): NodeCrypto | null {
  try {
    const req = Function("return require")() as (id: string) => unknown;
    return req("crypto") as NodeCrypto;
  } catch {
    return null;
  }
}

/**
 * SHA-256 over raw bytes, returning lowercase hex.
 * Uses WebCrypto when available and falls back to Node crypto in tests/builds.
 */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const hashBuffer = await subtle.digest("SHA-256", bytes);
    return bytesToHex(new Uint8Array(hashBuffer));
  }

  const nodeCrypto = getNodeCrypto();
  if (!nodeCrypto) {
    throw new Error("Node crypto is not available for SHA-256 hashing");
  }
  const hash = nodeCrypto.createHash("sha256");
  hash.update(bytes);
  return hash.digest("hex");
}
