import type { SerializedRageError } from "./errors.js";

export type RageWorkerRequest =
  | {
      id: number;
      type: "init";
    }
  | {
      id: number;
      type: "generateKeyPair";
    }
  | {
      id: number;
      type: "encryptWithRecipients";
      recipients: string[];
      data: Uint8Array;
      armor: boolean;
    }
  | {
      id: number;
      type: "decryptWithIdentity";
      identity: string;
      data: Uint8Array;
    }
  | {
      id: number;
      type: "encryptWithPassphrase";
      passphrase: string;
      data: Uint8Array;
      armor: boolean;
    }
  | {
      id: number;
      type: "decryptWithPassphrase";
      passphrase: string;
      data: Uint8Array;
    };

export type RageWorkerRequestPayload =
  | {
      type: "init";
    }
  | {
      type: "generateKeyPair";
    }
  | {
      type: "encryptWithRecipients";
      recipients: string[];
      data: Uint8Array;
      armor: boolean;
    }
  | {
      type: "decryptWithIdentity";
      identity: string;
      data: Uint8Array;
    }
  | {
      type: "encryptWithPassphrase";
      passphrase: string;
      data: Uint8Array;
      armor: boolean;
    }
  | {
      type: "decryptWithPassphrase";
      passphrase: string;
      data: Uint8Array;
    };

export type RageWorkerResponse =
  | {
      id: number;
      ok: true;
      value: unknown;
    }
  | {
      id: number;
      ok: false;
      error: SerializedRageError;
    };

export function getTransferList(
  message: RageWorkerRequest | RageWorkerResponse
): Transferable[] {
  if ("data" in message && message.data instanceof Uint8Array) {
    return [message.data.buffer];
  }

  if ("value" in message && message.value instanceof Uint8Array) {
    return [message.value.buffer];
  }

  return [];
}
