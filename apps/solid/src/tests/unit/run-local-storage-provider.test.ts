import { beforeEach, describe, expect, it } from "vitest";
import { createMnemonicIdentity } from "@ternent/identity";
import { useRunLocalStorageProvider } from "@/modules/run/storage";

describe("local storage run provider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("boots with a default local mount and seeded entries", async () => {
    const provider = useRunLocalStorageProvider();

    await provider.connect();
    const mounts = await provider.listMounts();
    const browse = await provider.browse?.(mounts[0]!.id, mounts[0]!.rootUrl);

    expect(provider.status.value).toBe("ready");
    expect(mounts[0]?.providerId).toBe("browser-local");
    expect(browse?.entries.map((entry) => entry.name)).toEqual([
      "local-journal.json",
      "scratch",
    ]);
  });

  it("persists created folders and ledgers in browser-local storage", async () => {
    const provider = useRunLocalStorageProvider();
    const signer = (await createMnemonicIdentity()).identity;

    await provider.connect();
    const mount = (await provider.listMounts())[0]!;
    await provider.createFolder?.({
      mountId: mount.id,
      parentUrl: mount.rootUrl,
      name: "notes",
    });
    await provider.createLedger?.({
      mountId: mount.id,
      parentUrl: mount.rootUrl,
      name: "project-log",
      signer,
    });

    const browse = await provider.browse?.(mount.id, mount.rootUrl);

    expect(browse?.entries.map((entry) => entry.name)).toContain("notes");
    expect(browse?.entries.map((entry) => entry.name)).toContain("project-log.json");
  });

  it("initializes created ledgers as replayable empty snapshots", async () => {
    const provider = useRunLocalStorageProvider();
    const signer = (await createMnemonicIdentity()).identity;

    await provider.connect();
    const mount = (await provider.listMounts())[0]!;
    const ledger = await provider.createLedger?.({
      mountId: mount.id,
      parentUrl: mount.rootUrl,
      name: "tasks",
      signer,
    });

    const storage = await provider.createLedgerStorageAdapter?.(mount.id, ledger!.url);
    const snapshot = await storage?.load();

    expect(provider.manifest.capabilities).toContain("ledger-storage");
    expect(storage).toBeTruthy();
    expect(snapshot?.container).toBeTruthy();
    expect(snapshot?.container?.head).toEqual(expect.any(String));
  });
});
