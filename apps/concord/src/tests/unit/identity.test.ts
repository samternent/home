import { describe, expect, it } from "vitest";
import { useIdentityCreate, useIdentityExport, useIdentityImport, useIdentitySession } from "@/modules/identity";

describe("identity flows", () => {
  it("creates and exports identity", async () => {
    const { clearIdentity, hasIdentity } = useIdentitySession();
    clearIdentity();

    const creator = useIdentityCreate();
    const created = await creator.create();

    expect(created.id).toMatch(/^identity-/);
    expect(hasIdentity.value).toBe(true);

    const exporter = useIdentityExport();
    expect(exporter.exportedPayload.value).toContain(created.id);
  });

  it("imports an exported payload", async () => {
    const { clearIdentity } = useIdentitySession();
    clearIdentity();

    const creator = useIdentityCreate();
    await creator.create();

    const exporter = useIdentityExport();
    const payload = exporter.exportedPayload.value;

    clearIdentity();

    const importer = useIdentityImport();
    const imported = await importer.importIdentity(payload);

    expect(imported.id).toMatch(/^identity-/);
    expect(imported.privateKeyPem).toContain("BEGIN PRIVATE KEY");
    expect(imported.publicKeyPem).toContain("BEGIN PUBLIC KEY");
  });
});
