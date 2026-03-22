import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { appConfig } from "@/app/config/app.config";

const identityRef = ref({
  serializedIdentity: {
    keyId: "child-1",
    publicKey: "test-public-key",
  },
});

vi.mock("@/modules/identity", () => ({
  useIdentitySession: () => ({
    identity: identityRef,
  }),
}));

const createConcordApp = vi.fn(async () => ({
  async load() {},
  subscribe() {},
  async destroy() {},
  getReplayState() {
    return {
      claimedPacksByEntryId: {},
      openedPacksByClaimEntryId: {},
    };
  },
}));

vi.mock("@ternent/concord", () => ({
  createConcordApp,
}));

vi.mock("@ternent/pixpax-concord", () => ({
  createPixbookPlugin: () => ({ name: "pixbook" }),
}));

vi.mock("@ternent/pixpax-issuer", () => ({
  verifyPackIssuanceProof: vi.fn(),
}));

function installIndexedDbMock() {
  const ledgers = new Map<string, unknown>();

  Object.defineProperty(window, "indexedDB", {
    configurable: true,
    writable: true,
    value: {
      open() {
        const request: Record<string, unknown> = {
          result: null,
          error: null,
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
        };

        queueMicrotask(() => {
          const db = {
            objectStoreNames: {
              contains: () => true,
            },
            createObjectStore() {},
            transaction() {
              const tx: Record<string, unknown> = {
                oncomplete: null,
              };
              return {
                get oncomplete() {
                  return tx.oncomplete;
                },
                set oncomplete(value) {
                  tx.oncomplete = value;
                },
                objectStore() {
                  return {
                    get(key: string) {
                      const op: Record<string, unknown> = {
                        result: null,
                        error: null,
                        onsuccess: null,
                        onerror: null,
                      };
                      queueMicrotask(() => {
                        op.result = ledgers.get(key) ?? null;
                        (op.onsuccess as (() => void) | null)?.();
                        (tx.oncomplete as (() => void) | null)?.();
                      });
                      return op;
                    },
                    put(value: unknown, key: string) {
                      const op: Record<string, unknown> = {
                        error: null,
                        onsuccess: null,
                        onerror: null,
                      };
                      queueMicrotask(() => {
                        ledgers.set(key, value);
                        (op.onsuccess as (() => void) | null)?.();
                        (tx.oncomplete as (() => void) | null)?.();
                      });
                      return op;
                    },
                    delete(key: string) {
                      const op: Record<string, unknown> = {
                        error: null,
                        onsuccess: null,
                        onerror: null,
                      };
                      queueMicrotask(() => {
                        ledgers.delete(key);
                        (op.onsuccess as (() => void) | null)?.();
                        (tx.oncomplete as (() => void) | null)?.();
                      });
                      return op;
                    },
                  };
                },
              };
            },
            close() {},
          };

          request.result = db;
          (request.onupgradeneeded as (() => void) | null)?.();
          (request.onsuccess as (() => void) | null)?.();
        });

        return request;
      },
    },
  });

  return ledgers;
}

describe("pixbook session", () => {
  beforeEach(() => {
    vi.resetModules();
    createConcordApp.mockClear();
  });

  it("clears the indexeddb-backed ledger on reset", async () => {
    const ledgers = installIndexedDbMock();
    const storageKey = `${appConfig.appId}/pixbook-ledger/${identityRef.value.serializedIdentity.keyId}`;
    ledgers.set(storageKey, {
      container: { head: "abc" },
      staged: [],
    });

    const mod = await import("@/modules/pixbook/usePixbookSession");
    const pixbook = mod.usePixbookSession();

    await pixbook.ensureReady();
    expect(ledgers.has(storageKey)).toBe(true);

    await pixbook.resetPixbook();

    expect(ledgers.has(storageKey)).toBe(false);
  });
});
