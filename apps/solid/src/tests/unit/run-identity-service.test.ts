import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMnemonicIdentity } from "@ternent/identity";
import { appConfig } from "@/app/config/app.config";
import { createRunIdentityService } from "@/modules/run/identity";
import type {
  RunIdentityBootstrapCandidate,
  RunIdentityRecord,
} from "@/modules/run/identity";
import type {
  RunStorageCapability,
  RunStorageProvider,
  RunStorageProviderRecord,
} from "@/modules/run/storage";
import type { RunProviderRegistry } from "@/modules/run/workspace/types";

const storageKey = `${appConfig.appId}/run-identity-catalog/v1`;

function createProviderRegistry(input?: {
  candidate?: RunIdentityBootstrapCandidate;
  record?: RunIdentityRecord | null;
  writeCachedIdentity?: (record: RunIdentityRecord) => Promise<void>;
}): RunProviderRegistry {
  const writeCachedIdentity =
    input?.writeCachedIdentity ?? (async (_record: RunIdentityRecord) => undefined);
  const capabilities: RunStorageCapability[] = ["identity-cache"];
  const provider: RunStorageProvider = {
    manifest: {
      id: "solid",
      label: "Solid",
      capabilities,
    },
    status: computed(() => "ready" as const),
    error: computed(() => null),
    mounts: computed(() => []),
    connect: vi.fn(async () => undefined),
    disconnect: vi.fn(async () => undefined),
    async listMounts() {
      return [];
    },
    listCachedIdentities: vi.fn(async () => (input?.candidate ? [input.candidate] : [])),
    readCachedIdentity: vi.fn(async () => input?.record ?? null),
    writeCachedIdentity: vi.fn(writeCachedIdentity),
  };

  const records = computed<RunStorageProviderRecord[]>(() => [
    {
      id: "solid",
      label: "Solid",
      capabilities,
      status: "ready",
      error: null,
      provider,
    },
  ]);

  return {
    providers: records,
    getProvider(providerId) {
      return providerId === "solid" ? provider : null;
    },
    async connectProvider() {
      return;
    },
    async disconnectProvider() {
      return;
    },
    async connectAll() {
      return;
    },
  };
}

async function buildRecord(label: string): Promise<RunIdentityRecord> {
  const created = await createMnemonicIdentity();

  return {
    id: created.identity.keyId,
    identity: created.identity,
    profile: {
      label,
      createdAt: created.identity.createdAt,
    },
  };
}

describe("run identity service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("boots from a valid local active identity", async () => {
    const record = await buildRecord("Primary");
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: "1",
        activeIdentityId: record.id,
        identities: [record],
      }),
    );

    const service = createRunIdentityService(createProviderRegistry());

    await service.init();

    expect(service.status.value).toBe("ready");
    expect(service.activeIdentity.value?.profile.label).toBe("Primary");
    expect(service.identities.value).toHaveLength(1);
  });

  it("rejects invalid stored identities and keeps the runtime gated", async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: "1",
        activeIdentityId: "broken",
        identities: [
          {
            id: "broken",
            identity: { keyId: "broken" },
            profile: {
              label: "Broken",
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          },
        ],
      }),
    );

    const service = createRunIdentityService(createProviderRegistry());

    await service.init();

    expect(service.status.value).toBe("missing");
    expect(service.identities.value).toHaveLength(0);
    expect(service.error.value).toContain("invalid");
  });

  it("deduplicates imports by keyId and supports multiple local identities", async () => {
    const service = createRunIdentityService(createProviderRegistry());

    await service.init();

    const created = await service.createMnemonicIdentity({ label: "One" });
    const duplicate = await service.importMnemonic({
      label: "Same signer",
      mnemonic: created.mnemonic,
    });
    const second = await service.createMnemonicIdentity({ label: "Two" });

    expect(duplicate.id).toBe(created.record.id);
    expect(service.identities.value).toHaveLength(2);
    expect(service.activeIdentity.value?.id).toBe(second.record.id);

    await service.removeIdentity(created.record.id);

    expect(service.identities.value.map((record) => record.profile.label)).toEqual(["Two"]);
  });

  it("can recover from a provider candidate and sync the active identity back", async () => {
    const cachedRecord = await buildRecord("Recovered from Solid");
    const writeCachedIdentity = vi.fn(async (_record: RunIdentityRecord) => undefined);
    const service = createRunIdentityService(
      createProviderRegistry({
        candidate: {
          id: "solid:candidate",
          providerId: "solid",
          cacheId: cachedRecord.id,
          label: cachedRecord.profile.label,
          createdAt: cachedRecord.profile.createdAt,
          keyId: cachedRecord.identity.keyId,
          publicKey: cachedRecord.identity.publicKey,
          valid: true,
          error: null,
        },
        record: cachedRecord,
        writeCachedIdentity,
      }),
    );

    await service.init();

    expect(service.bootstrapCandidates.value).toHaveLength(1);

    const adopted = await service.adoptBootstrapCandidate("solid:candidate");

    expect(adopted.id).toBe(cachedRecord.id);
    expect(service.activeIdentity.value?.id).toBe(cachedRecord.id);

    await service.syncIdentityToProvider("solid");

    expect(writeCachedIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        id: cachedRecord.id,
      }),
    );
  });
});
