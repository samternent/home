import { describe, expect, it } from "vitest";
import {
  createIdentityService,
  DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY,
  LEGACY_PLAINTEXT_IDENTITY_STORAGE_KEY,
  type LocalStorageLike,
} from "@/app/runtime";

function createMemoryStorage(): LocalStorageLike {
  const records = new Map<string, string>();
  return {
    getItem(key) {
      return records.get(key) ?? null;
    },
    setItem(key, value) {
      records.set(key, value);
    },
    removeItem(key) {
      records.delete(key);
    },
  };
}

describe("identity security flow", () => {
  it("creates encrypted local identity from onboarding draft and unlocks with password", async () => {
    const storage = createMemoryStorage();
    storage.setItem(LEGACY_PLAINTEXT_IDENTITY_STORAGE_KEY, "{\"legacy\":true}");

    const service = createIdentityService({
      storage,
    });

    const draft = await service.createOnboardingDraft();
    const created = await service.completeOnboarding({
      draft,
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
      mnemonicConfirmed: true,
      mfaEnabled: false,
    });

    expect(created.identityId).toBe(draft.identity.keyId);
    expect(storage.getItem(LEGACY_PLAINTEXT_IDENTITY_STORAGE_KEY)).toBeNull();

    const raw = storage.getItem(DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("\"mnemonic\":");
    expect(raw).not.toContain(draft.mnemonic.split(" ")[0]);

    await service.lock();

    const unlocked = await service.unlockWithPassword({
      password: "correct horse battery staple",
    });
    expect(unlocked.identityId).toBe(draft.identity.keyId);
  });

  it("rejects unlock with wrong password", async () => {
    const storage = createMemoryStorage();
    const service = createIdentityService({
      storage,
    });

    const draft = await service.createOnboardingDraft();
    await service.completeOnboarding({
      draft,
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
      mnemonicConfirmed: true,
      mfaEnabled: false,
    });
    await service.lock();

    await expect(
      service.unlockWithPassword({
        password: "wrong password",
      }),
    ).rejects.toThrow();
  });

  it("prefers explicit encrypted identity over local cache", async () => {
    const sourceStorage = createMemoryStorage();
    const sourceService = createIdentityService({
      storage: sourceStorage,
    });

    const draft = await sourceService.createOnboardingDraft();
    await sourceService.completeOnboarding({
      draft,
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
      mnemonicConfirmed: true,
      mfaEnabled: false,
    });
    await sourceService.lock();

    const explicitBlob = sourceStorage.getItem(DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY);
    expect(explicitBlob).toBeTruthy();

    const conflictingStorage = createMemoryStorage();
    conflictingStorage.setItem(
      DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY,
      JSON.stringify({
        format: "ternent-solid-local-identity",
        version: "1",
        createdAt: new Date().toISOString(),
        keyId: "conflict",
        publicKey: "conflict",
        ciphertext: "invalid",
        encryption: {
          scheme: "armour-passphrase",
          encoding: "armor",
          algorithm: "rage",
        },
        unlockPolicy: {
          password: true,
          totp: false,
        },
      }),
    );

    const explicitService = createIdentityService({
      storage: conflictingStorage,
      encryptedIdentity: explicitBlob ?? undefined,
    });

    const unlocked = await explicitService.unlockWithPassword({
      password: "correct horse battery staple",
    });

    expect(unlocked.identityId).toBe(draft.identity.keyId);
  });

  it("supports dev session unlock override across refresh and clears on lock", async () => {
    const storage = createMemoryStorage();
    const session = createMemoryStorage();

    const first = createIdentityService({
      storage,
      sessionStorage: session,
      devSessionUnlockBypass: true,
    });

    const draft = await first.createOnboardingDraft();
    const created = await first.completeOnboarding({
      draft,
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
      mnemonicConfirmed: true,
      mfaEnabled: false,
    });

    const refreshed = createIdentityService({
      storage,
      sessionStorage: session,
      devSessionUnlockBypass: true,
    });

    const restored = await refreshed.ensureUnlocked("auto");
    expect(restored.identityId).toBe(created.identityId);

    await refreshed.lock();

    const afterLock = createIdentityService({
      storage,
      sessionStorage: session,
      devSessionUnlockBypass: true,
    });

    await expect(afterLock.ensureUnlocked("auto")).rejects.toThrow(
      "Identity is locked. Unlock with password first.",
    );
  });

  it("recovers identity from mnemonic and persists encrypted payload", async () => {
    const storage = createMemoryStorage();
    const seedService = createIdentityService({ storage: createMemoryStorage() });

    const seedDraft = await seedService.createOnboardingDraft();
    const mnemonic = seedDraft.mnemonic;
    const expectedKeyId = seedDraft.identity.keyId;

    const recoveryService = createIdentityService({ storage });
    const recovered = await recoveryService.recoverFromMnemonic({
      mnemonic,
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
      mfaEnabled: false,
    });

    expect(recovered.identityId).toBe(expectedKeyId);
    const raw = storage.getItem(DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("\"mnemonic\":");
    expect(raw).not.toContain(mnemonic.split(" ")[0]);
  });
});
