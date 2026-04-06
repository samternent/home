import { computed, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMnemonicIdentity } from "@ternent/identity";
import type { RunBrowseEntry, RunBrowseResult, RunStorageProvider } from "@/modules/run/storage";
import { createRunProviderRegistry } from "@/modules/run/workspace/useRunProviderRegistry";
import { createRunMountRegistry } from "@/modules/run/workspace/useRunMountRegistry";
import { createRunWorkspaceRuntime } from "@/modules/run/workspace/useRunWorkspaceRuntime";

function createBrowse(
  url: string,
  entries: RunBrowseEntry[],
  parentUrl: string | null,
): RunBrowseResult {
  return {
    mountId: "memory-root",
    providerId: "memory",
    url,
    path: url.replace("memory://workspace", "") || "/",
    parentUrl,
    scope: "private",
    entries,
  };
}

function createMemoryProvider(): {
  provider: RunStorageProvider;
  browse: any;
  createFolder: any;
  createLedger: any;
  connect: any;
} {
  const status = ref<"idle" | "connecting" | "ready" | "error">("idle");
  const mounts = computed(() => [
    {
      id: "memory-root",
      providerId: "memory",
      label: "Memory Root",
      rootUrl: "memory://workspace/",
      writable: true,
      browsable: true,
      scope: "private" as const,
    },
  ]);
  const connect = vi.fn(async () => {
    status.value = "ready";
  });
  const browse = vi.fn(async (_mountId: string, url: string) => {
    if (url === "memory://workspace/") {
      return createBrowse(
        url,
        [
          {
            id: "memory://workspace/projects/",
            mountId: "memory-root",
            providerId: "memory",
            url: "memory://workspace/projects/",
            path: "/projects/",
            name: "projects",
            kind: "container",
            contentType: null,
            writable: true,
            lastModified: null,
            scope: "private",
          },
          {
            id: "memory://workspace/journal.json",
            mountId: "memory-root",
            providerId: "memory",
            url: "memory://workspace/journal.json",
            path: "/journal.json",
            name: "journal.json",
            kind: "ledger",
            contentType: "application/json",
            writable: true,
            lastModified: null,
            scope: "private",
          },
        ],
        null,
      );
    }

    return createBrowse(url, [], "memory://workspace/");
  });
  const createFolder = vi.fn(async (input: { mountId: string; parentUrl: string; name: string }) => ({
    id: `${input.parentUrl}${input.name}/`,
    mountId: "memory-root",
    providerId: "memory",
    url: `${input.parentUrl}${input.name}/`,
    path: `/${input.name}/`,
    name: input.name,
    kind: "container" as const,
    contentType: null,
    writable: true,
    lastModified: null,
    scope: "private",
  }));
  const createLedger = vi.fn(async (input: { mountId: string; parentUrl: string; name: string }) => ({
    id: `${input.parentUrl}${input.name}.json`,
    mountId: "memory-root",
    providerId: "memory",
    url: `${input.parentUrl}${input.name}.json`,
    path: `/${input.name}.json`,
    name: `${input.name}.json`,
    kind: "ledger" as const,
    contentType: "application/json",
    writable: true,
    lastModified: null,
    scope: "private",
  }));

  return {
    connect,
    browse,
    createFolder,
    createLedger,
    provider: {
      manifest: {
        id: "memory",
        label: "Memory",
        capabilities: ["mount", "browse", "stat", "create-folder"],
      },
      status: computed(() => status.value),
      error: computed(() => null),
      mounts,
      connect,
      disconnect: vi.fn(async () => {
        status.value = "idle";
      }),
      async listMounts() {
        return mounts.value;
      },
      browse,
      stat: vi.fn(async () => null),
      createFolder,
      createLedger,
    },
  };
}

describe("run workspace runtime seam", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("connects providers, loads browsable mounts, and exposes provider-backed browse state", async () => {
    const memory = createMemoryProvider();
    const providerRegistry = createRunProviderRegistry([memory.provider]);
    const mountRegistry = createRunMountRegistry(providerRegistry);
    const runtime = createRunWorkspaceRuntime(providerRegistry, mountRegistry);

    await runtime.init();

    expect(memory.connect).toHaveBeenCalledTimes(1);
    expect(runtime.providers.value[0]?.id).toBe("memory");
    expect(runtime.selection.value.activeMountId).toBe("memory-root");
    expect(runtime.currentBrowse.value?.url).toBe("memory://workspace/");
    expect(runtime.currentBrowse.value?.entries.map((entry) => entry.kind)).toEqual([
      "container",
      "ledger",
    ]);
  });

  it("routes create actions through the active provider capability seam", async () => {
    const memory = createMemoryProvider();
    const providerRegistry = createRunProviderRegistry([memory.provider]);
    const mountRegistry = createRunMountRegistry(providerRegistry);
    const runtime = createRunWorkspaceRuntime(providerRegistry, mountRegistry);

    await runtime.init();
    const entry = await runtime.createFolder("notes");

    expect(memory.createFolder).toHaveBeenCalledWith({
      mountId: "memory-root",
      parentUrl: "memory://workspace/",
      name: "notes",
    });
    expect(entry?.url).toBe("memory://workspace/notes/");
    expect(memory.browse).toHaveBeenLastCalledWith("memory-root", "memory://workspace/");
  });

  it("threads signer context through ledger creation instead of letting providers resolve identity", async () => {
    const signer = (await createMnemonicIdentity()).identity;
    const memory = createMemoryProvider();
    const providerRegistry = createRunProviderRegistry([memory.provider]);
    const mountRegistry = createRunMountRegistry(providerRegistry);
    const runtime = createRunWorkspaceRuntime(providerRegistry, mountRegistry);

    await runtime.init();
    const entry = await runtime.createLedger("journal", signer);

    expect(memory.createLedger).toHaveBeenCalledWith({
      mountId: "memory-root",
      parentUrl: "memory://workspace/",
      name: "journal",
      signer,
    });
    expect(entry?.name).toBe("journal.json");
  });

  it("resets browse state without dropping provider mounts", async () => {
    const memory = createMemoryProvider();
    const providerRegistry = createRunProviderRegistry([memory.provider]);
    const mountRegistry = createRunMountRegistry(providerRegistry);
    const runtime = createRunWorkspaceRuntime(providerRegistry, mountRegistry);

    await runtime.init();
    await runtime.selectEntry(runtime.currentBrowse.value?.entries[1] ?? null);

    expect(runtime.selection.value.activeResourceId).toBe("memory://workspace/journal.json");

    await runtime.reset();

    expect(runtime.selection.value.activeResourceId).toBeNull();
    expect(runtime.selection.value.activeMountId).toBe("memory-root");
    expect(runtime.currentBrowse.value?.url).toBe("memory://workspace/");
    expect(runtime.mounts.value).toHaveLength(1);
  });

  it("restores the last browse url and selected ledger on init", async () => {
    localStorage.setItem(
      "run.workspace.session.v1",
      JSON.stringify({
        activeMountId: "memory-root",
        activeBrowseUrl: "memory://workspace/",
        selectedEntryUrl: "memory://workspace/journal.json",
      }),
    );

    const memory = createMemoryProvider();
    memory.provider.stat = vi.fn(async (_mountId: string, url: string) => {
      if (url === "memory://workspace/journal.json") {
        return {
          id: "memory://workspace/journal.json",
          mountId: "memory-root",
          providerId: "memory",
          url: "memory://workspace/journal.json",
          path: "/journal.json",
          name: "journal.json",
          kind: "ledger" as const,
          contentType: "application/json",
          writable: true,
          lastModified: null,
          scope: "private",
        };
      }

      return null;
    });

    const providerRegistry = createRunProviderRegistry([memory.provider]);
    const mountRegistry = createRunMountRegistry(providerRegistry);
    const runtime = createRunWorkspaceRuntime(providerRegistry, mountRegistry);

    await runtime.init();

    expect(runtime.currentBrowse.value?.url).toBe("memory://workspace/");
    expect(runtime.selection.value.activeResourceId).toBe("memory://workspace/journal.json");
    expect(runtime.selection.value.activeLedgerIds).toEqual(["memory://workspace/journal.json"]);
  });
});
