import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { createSealHash } from "../proof";
import {
  SEAL_MANIFEST_TYPE,
  SEAL_MANIFEST_VERSION,
  stringifySealManifest,
  type SealManifestV1,
} from "../manifest";

function normalizeRelativePath(value: string): string {
  return value.split("\\").join("/");
}

async function collectFiles(
  rootPath: string,
  currentPath: string,
  files: Record<string, SealManifestV1["files"][string]>
): Promise<void> {
  const entries = await readdir(currentPath, { withFileTypes: true });
  const sorted = entries
    .filter((entry) => entry.name !== ".DS_Store")
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of sorted) {
    const entryPath = join(currentPath, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(rootPath, entryPath, files);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const bytes = await readFile(entryPath);
    const relativePath = normalizeRelativePath(relative(rootPath, entryPath));
    files[relativePath] = await createSealHash(bytes);
  }
}

export async function createManifestArtifact(inputPath: string): Promise<{
  manifest: SealManifestV1;
  content: string;
}> {
  const resolvedInput = resolve(inputPath);
  const inputStat = await stat(resolvedInput);
  const root = basename(resolvedInput);
  const files: SealManifestV1["files"] = {};

  if (inputStat.isDirectory()) {
    await collectFiles(resolvedInput, resolvedInput, files);
  } else if (inputStat.isFile()) {
    const bytes = await readFile(resolvedInput);
    files[root] = await createSealHash(bytes);
  } else {
    throw new Error("Manifest input must be a file or directory.");
  }

  const manifest: SealManifestV1 = {
    version: SEAL_MANIFEST_VERSION,
    type: SEAL_MANIFEST_TYPE,
    root,
    files: Object.fromEntries(
      Object.entries(files).sort(([left], [right]) => left.localeCompare(right))
    ),
  };

  return {
    manifest,
    content: `${stringifySealManifest(manifest)}\n`,
  };
}
