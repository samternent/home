import { RageInitError, serializeError } from "./errors.js";
import { getWasmBindings, loadWasmBindings } from "./wasm.js";
import {
  getTransferList,
  type RageWorkerRequest,
  type RageWorkerResponse,
} from "./worker-protocol.js";

declare const self: DedicatedWorkerGlobalScope;

let initialized = false;

self.addEventListener("message", (event: MessageEvent<RageWorkerRequest>) => {
  void handleRequest(event.data);
});

async function assertInitialized(): Promise<void> {
  if (!initialized) {
    throw new RageInitError(
      "RAGE_INIT_FAILED",
      "Rage WASM is not initialized. Call initRage() before using @ternent/rage.",
    );
  }
}

async function handleRequest(request: RageWorkerRequest): Promise<void> {
  let response: RageWorkerResponse;

  try {
    switch (request.type) {
      case "init":
        await loadWasmBindings();
        initialized = true;
        response = {
          id: request.id,
          ok: true,
          value: null,
        };
        break;
      case "generateKeyPair":
        await assertInitialized();
        response = {
          id: request.id,
          ok: true,
          value: await getWasmBindings().generateKeyPair(),
        };
        break;
      case "encryptWithRecipients":
        await assertInitialized();
        response = {
          id: request.id,
          ok: true,
          value: await getWasmBindings().encryptWithRecipients(
            request.recipients,
            request.data,
            request.armor,
          ),
        };
        break;
      case "decryptWithIdentity":
        await assertInitialized();
        response = {
          id: request.id,
          ok: true,
          value: await getWasmBindings().decryptWithIdentity(request.identity, request.data),
        };
        break;
      case "encryptWithPassphrase":
        await assertInitialized();
        response = {
          id: request.id,
          ok: true,
          value: await getWasmBindings().encryptWithPassphrase(
            request.passphrase,
            request.data,
            request.armor,
          ),
        };
        break;
      case "decryptWithPassphrase":
        await assertInitialized();
        response = {
          id: request.id,
          ok: true,
          value: await getWasmBindings().decryptWithPassphrase(request.passphrase, request.data),
        };
        break;
    }
  } catch (error) {
    response = {
      id: request.id,
      ok: false,
      error: serializeError(error),
    };
  }

  self.postMessage(response, getTransferList(response));
}

export {};
