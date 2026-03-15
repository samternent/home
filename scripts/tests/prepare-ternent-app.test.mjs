import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);

test("prepare script creates a starter manifest outside apps", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "prepare-ternent-app-"));
  const outPath = path.join(tempDir, "ledger-demo.yaml");

  const result = spawnSync(
    "node",
    [
      "scripts/prepare-ternent-app.mjs",
      "--",
      "--out",
      outPath,
      "--name",
      "ledger-demo",
      "--title",
      "Ledger Demo",
      "--host",
      "ledger-demo.ternent.dev",
      "--theme",
      "aurora",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(fs.existsSync(outPath));

  const manifest = fs.readFileSync(outPath, "utf8");
  assert.match(manifest, /id:\s+ledger-demo/);
  assert.match(manifest, /title:\s+Ledger Demo/);
  assert.match(manifest, /themeName:\s+aurora/);
});
