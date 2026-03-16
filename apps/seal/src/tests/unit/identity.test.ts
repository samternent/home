import { describe, expect, it } from "vitest";
import {
  rememberedIdentityStorageKey,
  rememberIdentityFlagStorageKey,
  useIdentityCreate,
  useIdentityExport,
  useIdentityImport,
  useIdentitySession,
} from "@/modules/identity";

describe("identity session", () => {
  it("keeps identity in memory by default", async () => {
    const session = useIdentitySession();
    session.clearIdentity();
    session.setRememberInBrowser(false);

    const creator = useIdentityCreate();
    await creator.create();

    expect(session.hasIdentity.value).toBe(true);
    expect(localStorage.getItem(rememberedIdentityStorageKey)).toBeNull();
    expect(localStorage.getItem(rememberIdentityFlagStorageKey)).toBe("false");
  });

  it("persists identity only when remember is enabled", async () => {
    const session = useIdentitySession();
    session.clearIdentity();
    session.setRememberInBrowser(true);

    const creator = useIdentityCreate();
    const created = await creator.create();

    const remembered = JSON.parse(localStorage.getItem(rememberedIdentityStorageKey) || "null");

    expect(session.hasIdentity.value).toBe(true);
    expect(remembered?.id).toBe(created.id);
    expect(localStorage.getItem(rememberIdentityFlagStorageKey)).toBe("true");
  });

  it("imports from exported payload", async () => {
    const session = useIdentitySession();
    session.clearIdentity();

    const creator = useIdentityCreate();
    await creator.create();

    const exporter = useIdentityExport();
    const payload = exporter.exportedPayload.value;
    const exported = JSON.parse(payload) as Record<string, unknown>;

    expect(exported.id).toBeUndefined();

    session.clearIdentity();

    const importer = useIdentityImport();
    const imported = await importer.importIdentity(payload);

    expect(imported.material.seed.length).toBeGreaterThan(10);
    expect(imported.publicKey.length).toBeGreaterThan(10);
    expect(session.identity.value?.keyId).toBe(imported.keyId);
    expect(exported.material).toMatchObject({ kind: "seed" });
    expect(exported.seed).toBeUndefined();
  });

  it("imports from a valid mnemonic phrase", async () => {
    const session = useIdentitySession();
    session.clearIdentity();

    const importer = useIdentityImport();
    const imported = await importer.importMnemonic(
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
      "TREZOR"
    );

    expect(imported.material.kind).toBe("seed");
    expect(imported.material.seed.length).toBeGreaterThan(10);
    expect(session.identity.value?.keyId).toBe(imported.keyId);
  });

  it("rejects legacy PEM imports", async () => {
    const session = useIdentitySession();
    session.clearIdentity();

    const creator = useIdentityCreate();
    const created = await creator.create();

    session.clearIdentity();

    const importer = useIdentityImport();
    await expect(
      importer.importIdentity(
        JSON.stringify({
          id: created.id,
          createdAt: created.createdAt,
          publicKeyPem: "legacy",
          privateKeyPem: "legacy",
          fingerprint: created.keyId,
        })
      )
    ).rejects.toThrow(/Legacy PEM identities/);
    expect(session.identity.value).toBeNull();
  });

  it("clear removes active and remembered identity", async () => {
    const session = useIdentitySession();
    session.setRememberInBrowser(true);

    const creator = useIdentityCreate();
    await creator.create();

    session.clearIdentity();

    expect(session.hasIdentity.value).toBe(false);
    expect(localStorage.getItem(rememberedIdentityStorageKey)).toBeNull();
  });
});
