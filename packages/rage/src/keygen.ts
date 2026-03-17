import { RageInitError } from "./errors.js";
import { assertRageInitialized } from "./init.js";
import type { RageKeyPair } from "./types.js";
import { getWasmBindings } from "./wasm.js";

export async function generateKeyPair(): Promise<RageKeyPair> {
  assertRageInitialized();

  const result = await getWasmBindings().generateKeyPair();
  if (!Array.isArray(result) || result.length !== 2) {
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Rage WASM returned an invalid keypair."
    );
  }

  const [privateKey, publicKey] = result;
  if (
    typeof privateKey !== "string" ||
    !privateKey.startsWith("AGE-SECRET-KEY-") ||
    typeof publicKey !== "string" ||
    !publicKey.startsWith("age1")
  ) {
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Rage WASM returned an invalid keypair."
    );
  }

  return {
    type: "x25519",
    privateKey,
    publicKey,
  };
}
