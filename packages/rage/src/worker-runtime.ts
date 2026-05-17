import { RageInitError, deserializeError } from "./errors.js";
import type { RageRuntime } from "./runtime-types.js";
import RageWorker from "./worker?worker";
import {
  getTransferList,
  type RageWorkerRequestPayload,
  type RageWorkerRequest,
  type RageWorkerResponse,
} from "./worker-protocol.js";

interface PendingRequest {
  resolve(value: unknown): void;
  reject(reason: unknown): void;
}

function cloneBytes(data: Uint8Array): Uint8Array {
  return Uint8Array.from(data);
}

class WorkerRageRuntime implements RageRuntime {
  private worker: Worker | null = null;
  private nextRequestId = 0;
  private ready = false;
  private initPromise: Promise<void> | null = null;
  private readonly pending = new Map<number, PendingRequest>();

  async init(): Promise<void> {
    if (this.ready) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = this.request<void>({
        type: "init",
      })
        .then(() => {
          this.ready = true;
        })
        .catch((error) => {
          this.resetWorker();
          throw error;
        });
    }

    return this.initPromise;
  }

  async generateKeyPair(): Promise<unknown> {
    await this.ensureReady();
    return this.request({
      type: "generateKeyPair",
    });
  }

  async encryptWithRecipients(
    recipients: string[],
    data: Uint8Array,
    armor: boolean,
  ): Promise<unknown> {
    await this.ensureReady();
    return this.request({
      type: "encryptWithRecipients",
      recipients: [...recipients],
      data: cloneBytes(data),
      armor,
    });
  }

  async decryptWithIdentity(identity: string, data: Uint8Array): Promise<unknown> {
    await this.ensureReady();
    return this.request({
      type: "decryptWithIdentity",
      identity,
      data: cloneBytes(data),
    });
  }

  async encryptWithPassphrase(
    passphrase: string,
    data: Uint8Array,
    armor: boolean,
  ): Promise<unknown> {
    await this.ensureReady();
    return this.request({
      type: "encryptWithPassphrase",
      passphrase,
      data: cloneBytes(data),
      armor,
    });
  }

  async decryptWithPassphrase(passphrase: string, data: Uint8Array): Promise<unknown> {
    await this.ensureReady();
    return this.request({
      type: "decryptWithPassphrase",
      passphrase,
      data: cloneBytes(data),
    });
  }

  private async ensureReady(): Promise<void> {
    if (this.ready) {
      return;
    }

    await this.init();
  }

  private request<T>(request: RageWorkerRequestPayload): Promise<T> {
    const id = this.nextRequestId;
    this.nextRequestId += 1;

    const message: RageWorkerRequest = {
      id,
      ...request,
    };

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve,
        reject,
      });

      try {
        const worker = this.getWorker();
        worker.postMessage(message, getTransferList(message));
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  private getWorker(): Worker {
    if (!this.worker) {
      const worker = new RageWorker();
      worker.addEventListener("message", this.handleMessage);
      worker.addEventListener("error", this.handleError);
      worker.addEventListener("messageerror", this.handleMessageError);
      this.worker = worker;
    }

    return this.worker;
  }

  private readonly handleMessage = (event: MessageEvent<RageWorkerResponse>): void => {
    const pending = this.pending.get(event.data.id);
    if (!pending) {
      return;
    }

    this.pending.delete(event.data.id);
    if (event.data.ok) {
      pending.resolve(event.data.value);
      return;
    }

    pending.reject(deserializeError(event.data.error));
  };

  private readonly handleError = (event: ErrorEvent): void => {
    const message =
      typeof event.message === "string" && event.message.length > 0
        ? event.message
        : "Rage worker failed.";
    this.handleFatalError(new RageInitError("RAGE_INIT_FAILED", message, event));
  };

  private readonly handleMessageError = (): void => {
    this.handleFatalError(
      new RageInitError("RAGE_INIT_FAILED", "Rage worker failed to exchange messages."),
    );
  };

  private handleFatalError(error: unknown): void {
    this.failPending(error);
    this.resetWorker();
  }

  private failPending(error: unknown): void {
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }

  private resetWorker(): void {
    if (this.worker) {
      this.worker.removeEventListener("message", this.handleMessage);
      this.worker.removeEventListener("error", this.handleError);
      this.worker.removeEventListener("messageerror", this.handleMessageError);
      this.worker.terminate();
      this.worker = null;
    }

    this.ready = false;
    this.initPromise = null;
  }
}

export function createWorkerRageRuntime(): RageRuntime {
  return new WorkerRageRuntime();
}
