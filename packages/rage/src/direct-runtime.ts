import type { RageRuntime } from "./runtime-types.js";
import { getWasmBindings, loadWasmBindings } from "./wasm.js";

export function createDirectRageRuntime(): RageRuntime {
  return {
    init: loadWasmBindings,
    generateKeyPair: () => getWasmBindings().generateKeyPair(),
    encryptWithRecipients: (recipients, data, armor) =>
      getWasmBindings().encryptWithRecipients(recipients, data, armor),
    decryptWithIdentity: (identity, data) => getWasmBindings().decryptWithIdentity(identity, data),
    encryptWithPassphrase: (passphrase, data, armor) =>
      getWasmBindings().encryptWithPassphrase(passphrase, data, armor),
    decryptWithPassphrase: (passphrase, data) =>
      getWasmBindings().decryptWithPassphrase(passphrase, data),
  };
}
