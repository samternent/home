import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createManifestArtifact } from "../src/commands/manifest";

async function createFixtureTree(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "seal-manifest-"));
  await mkdir(join(root, "nested"), { recursive: true });
  await writeFile(join(root, "a.txt"), "alpha\n", "utf8");
  await writeFile(join(root, ".DS_Store"), "ignore", "utf8");
  await writeFile(join(root, "nested", "b.txt"), "beta\n", "utf8");
  return root;
}

describe("manifest command", () => {
  it("is deterministic across runs", async () => {
    const fixtureRoot = await createFixtureTree();
    const first = await createManifestArtifact(fixtureRoot);
    const second = await createManifestArtifact(fixtureRoot);

    expect(first.content).toBe(second.content);
    expect(first.manifest).toEqual(second.manifest);
  });

  it("excludes .DS_Store and sorts file keys", async () => {
    const fixtureRoot = await createFixtureTree();
    const { manifest } = await createManifestArtifact(fixtureRoot);

    expect(Object.keys(manifest.files)).toEqual(["a.txt", "nested/b.txt"]);
  });
});
