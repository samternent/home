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

    session.clearIdentity();

    const importer = useIdentityImport();
    const imported = await importer.importIdentity(payload);

    expect(imported.privateKeyPem).toContain("BEGIN PRIVATE KEY");
    expect(imported.publicKeyPem).toContain("BEGIN PUBLIC KEY");
    expect(session.identity.value?.fingerprint).toBe(imported.fingerprint);
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
