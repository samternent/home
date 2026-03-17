import initWasm, {
  decrypt_with_identity as rawDecryptWithIdentity,
  decrypt_with_passphrase as rawDecryptWithPassphrase,
  encrypt_with_passphrase as rawEncryptWithPassphrase,
  encrypt_with_recipients as rawEncryptWithRecipients,
  generate_keypair as rawGenerateKeypair,
} from "../pkg/ternent_rage_wasm.js";
import { RageInitError } from "./errors.js";
import { wasmBase64 } from "./wasm-bytes.js";

export interface RageWasmBindings {
  generateKeyPair(): Promise<unknown>;
  encryptWithRecipients(
    recipients: string[],
    data: Uint8Array,
    armor: boolean
  ): Promise<unknown>;
  decryptWithIdentity(identity: string, data: Uint8Array): Promise<unknown>;
  encryptWithPassphrase(
    passphrase: string,
    data: Uint8Array,
    armor: boolean
  ): Promise<unknown>;
  decryptWithPassphrase(
    passphrase: string,
    data: Uint8Array
  ): Promise<unknown>;
}

let bindings: RageWasmBindings | null = null;

function decodeBase64(input: string): Uint8Array {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const cleanInput = input.replace(/\s+/g, "");
  const padding = cleanInput.endsWith("==")
    ? 2
    : cleanInput.endsWith("=")
      ? 1
      : 0;
  const output = new Uint8Array((cleanInput.length * 3) / 4 - padding);

  let offset = 0;
  for (let index = 0; index < cleanInput.length; index += 4) {
    const a = alphabet.indexOf(cleanInput[index] ?? "A");
    const b = alphabet.indexOf(cleanInput[index + 1] ?? "A");
    const cChar = cleanInput[index + 2] ?? "A";
    const dChar = cleanInput[index + 3] ?? "A";
    const c = cChar === "=" ? 0 : alphabet.indexOf(cChar);
    const d = dChar === "=" ? 0 : alphabet.indexOf(dChar);

    if (a < 0 || b < 0 || c < 0 || d < 0) {
      throw new RageInitError(
        "RAGE_INIT_FAILED",
        "Rage WASM binary is not valid base64."
      );
    }

    const chunk = (a << 18) | (b << 12) | (c << 6) | d;
    output[offset] = (chunk >> 16) & 0xff;
    offset += 1;

    if (cChar !== "=") {
      output[offset] = (chunk >> 8) & 0xff;
      offset += 1;
    }

    if (dChar !== "=") {
      output[offset] = chunk & 0xff;
      offset += 1;
    }
  }

  return output;
}

export async function loadWasmBindings(): Promise<void> {
  if (bindings) {
    return;
  }

  if (!wasmBase64) {
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Rage WASM is not embedded. Run the package build first."
    );
  }

  try {
    await initWasm(decodeBase64(wasmBase64));
    bindings = {
      generateKeyPair: rawGenerateKeypair,
      encryptWithRecipients: rawEncryptWithRecipients,
      decryptWithIdentity: rawDecryptWithIdentity,
      encryptWithPassphrase: rawEncryptWithPassphrase,
      decryptWithPassphrase: rawDecryptWithPassphrase,
    };
  } catch (error) {
    bindings = null;
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Failed to initialize Rage WASM.",
      error
    );
  }
}

export function getWasmBindings(): RageWasmBindings {
  if (!bindings) {
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Rage WASM is not initialized. Call initRage() before using @ternent/rage."
    );
  }

  return bindings;
}
