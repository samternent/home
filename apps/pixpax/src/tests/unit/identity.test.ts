import { describe, expect, it, vi } from "vitest";
import { useIdentityCreate, useIdentityExport, useIdentityImport, useIdentitySession } from "@/modules/identity";
import { identityDirectoryStorageKey } from "@/modules/identity/useIdentitySession";

function clearAllLocalIdentities() {
  const session = useIdentitySession();
  for (const identity of [...session.identities.value]) {
    session.removeIdentity(identity.id);
  }
}

describe("identity flows", () => {
  it("creates and exports identity", async () => {
    const { hasIdentity } = useIdentitySession();
    clearAllLocalIdentities();

    const creator = useIdentityCreate();
    const created = await creator.create();

    expect(created.id).toMatch(/^identity-/);
    expect(hasIdentity.value).toBe(true);
    expect(localStorage.getItem(identityDirectoryStorageKey)).toContain(created.serializedIdentity.keyId);

    const exporter = useIdentityExport();
    expect(exporter.exportedPayload.value).toContain("\"format\": \"ternent-identity\"");
    expect(exporter.exportedPayload.value).toContain(created.serializedIdentity.keyId);
  });

  it("imports an exported payload", async () => {
    clearAllLocalIdentities();

    const creator = useIdentityCreate();
    await creator.create();

    const exporter = useIdentityExport();
    const payload = exporter.exportedPayload.value;

    clearAllLocalIdentities();

    const importer = useIdentityImport();
    const imported = await importer.importIdentity(payload);

    expect(imported.id).toMatch(/^identity-/);
    expect(imported.serializedIdentity.format).toBe("ternent-identity");
    expect(imported.serializedIdentity.keyId).toBeTruthy();
  });

  it("rehydrates identity from browser storage after a module reload", async () => {
    clearAllLocalIdentities();

    const creator = useIdentityCreate();
    const created = await creator.create();

    vi.resetModules();

    const reloaded = await import("@/modules/identity");
    const session = reloaded.useIdentitySession();

    expect(session.identity.value?.serializedIdentity.keyId).toBe(
      created.serializedIdentity.keyId,
    );
    expect(session.hasIdentity.value).toBe(true);
  });
});
