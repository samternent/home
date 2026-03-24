import { describe, expect, it } from "vitest";
import type { SolidWorkspaceEntry } from "@ternent/solid";
import {
  buildConcordOsHostedAppRoute,
  createConcordOsOpenTarget,
  resolveConcordOsLedgerCompatibility,
} from "@/modules/concord-os/apps";

function createEntry(
  input: Partial<SolidWorkspaceEntry> & Pick<SolidWorkspaceEntry, "url" | "name" | "path">,
): SolidWorkspaceEntry {
  return {
    parentUrl: "https://pod.example/concord/workspace/private/",
    kind: "file",
    scope: "private",
    contentType: "application/json",
    size: 128,
    lastModified: null,
    etag: null,
    isLedger: false,
    ...input,
  };
}

describe("ConcordOS app registry", () => {
  it("matches Todo for Concord ledgers", () => {
    const target = createConcordOsOpenTarget(
      createEntry({
        url: "https://pod.example/concord/workspace/private/project-ledger.json",
        name: "project-ledger.json",
        path: "project-ledger.json",
        isLedger: true,
      }),
    );

    const compatible = resolveConcordOsLedgerCompatibility(target);

    expect(compatible).toHaveLength(1);
    expect(compatible[0]).toMatchObject({
      appId: "todo",
      supported: true,
      isDefault: true,
    });
  });

  it("does not match hosted apps for non-ledger resources", () => {
    const target = createConcordOsOpenTarget(
      createEntry({
        url: "https://pod.example/concord/workspace/private/spec.md",
        name: "spec.md",
        path: "spec.md",
        contentType: "text/markdown",
      }),
    );

    expect(resolveConcordOsLedgerCompatibility(target)).toEqual([]);
  });

  it("builds a dedicated hosted route for a ledger", () => {
    const target = createConcordOsOpenTarget(
      createEntry({
        url: "https://pod.example/concord/workspace/private/projects/demo/ledger.json",
        name: "ledger.json",
        path: "projects/demo/ledger.json",
        isLedger: true,
      }),
    );

    expect(buildConcordOsHostedAppRoute(target, "todo")).toEqual({
      name: "app-open",
      params: {
        scope: "private",
        appId: "todo",
        encodedPath: "projects%2Fdemo%2Fledger.json",
      },
    });
  });
});
