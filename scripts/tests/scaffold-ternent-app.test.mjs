import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);

function runNodeScript(args) {
  const result = spawnSync("node", args, {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "script failed");
  }

  return result;
}

function removeDir(targetDir) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

test("scaffold creates an app from a manifest file", () => {
  const appId = `codex-manifest-${Date.now()}`;
  const targetDir = path.join(repoRoot, "apps", appId);
  const manifestPath = path.join(os.tmpdir(), `${appId}.yaml`);

  fs.writeFileSync(
    manifestPath,
    `app:
  id: ${appId}
  title: Manifest App
  host: ${appId}.ternent.dev
  themeName: aurora
  defaultThemeMode: dark
seo:
  description: Manifest App description
landing:
  navigationLinks:
    - href: "#features"
      label: Features
  hero:
    eyebrow: ternent.dev
    title: Manifest app title
    description: Manifest app description
    primaryAction:
      href: /settings
      label: Open settings
    preview:
      title: Preview
      rows:
        - label: Status
          value: Ready
  featureSection:
    eyebrow: Features
    title: Features
    items:
      - title: One
        description: One
  howItWorksSection:
    eyebrow: How
    title: How
    preview:
      title: Steps
      rows:
        - label: Step
          value: One
    steps:
      - title: One
        description: One
  useCasesSection:
    eyebrow: Use cases
    title: Use cases
    items:
      - title: One
        description: One
  developerSection:
    eyebrow: Developers
    title: Developers
    description: Developers
    surfaces:
      - Web app
    tabs:
      - value: cli
        label: CLI
        title: CLI
        meta: CLI
        code: echo test
        supportingCopy: Test
        link:
          href: https://example.com
          label: Example
  clarifierSection:
    eyebrow: Definition
    title: Definition
    columns:
      - title: Is
        items:
          - One
  ctaSection:
    eyebrow: Ready
    title: Ready
    description: Ready
    primaryAction:
      href: /settings
      label: Start
  footer:
    brandLabel: Example
    copyright: © 2026.
    links:
      - href: /
        label: Home
`,
    "utf8",
  );

  try {
    runNodeScript(["scripts/scaffold-ternent-app.mjs", "--", "--manifest", manifestPath]);

    assert.ok(fs.existsSync(path.join(targetDir, "app.yaml")));
    assert.ok(fs.existsSync(path.join(targetDir, "src", "app", "config", "app.generated.ts")));
    assert.match(
      fs.readFileSync(path.join(targetDir, "src", "app", "config", "theme.generated.ts"), "utf8"),
      /ternent-ui\/themes\/aurora\.css/,
    );
    assert.match(
      fs.readFileSync(path.join(targetDir, "tsconfig.json"), "utf8"),
      /"extends": "\.\.\/\.\.\/tsconfig\.json"/,
    );
  } finally {
    removeDir(targetDir);
    fs.rmSync(manifestPath, { force: true });
  }
});

test("scaffold shorthand writes a manifest and sync updates generated config", () => {
  const appId = `codex-flags-${Date.now()}`;
  const targetDir = path.join(repoRoot, "apps", appId);
  const manifestPath = path.join(targetDir, "app.yaml");

  try {
    runNodeScript([
      "scripts/scaffold-ternent-app.mjs",
      "--",
      "--name",
      appId,
      "--title",
      "Flags App",
      "--host",
      `${appId}.ternent.dev`,
      "--theme",
      "harbor-rose",
    ]);

    const manifestSource = fs.readFileSync(manifestPath, "utf8");
    assert.match(manifestSource, new RegExp(`id:\\s+${appId}`));
    assert.match(manifestSource, /themeName:\s+harbor-rose/);

    const customFile = path.join(targetDir, "custom.txt");
    fs.writeFileSync(customFile, "leave me alone", "utf8");

    fs.writeFileSync(
      manifestPath,
      manifestSource.replace("themeName: harbor-rose", "themeName: prism"),
      "utf8",
    );
    fs.writeFileSync(
      path.join(targetDir, "tsconfig.json"),
      fs
        .readFileSync(path.join(targetDir, "tsconfig.json"), "utf8")
        .replace('"extends": "../../tsconfig.json"', '"extends": "../../../tsconfig.json"'),
      "utf8",
    );

    runNodeScript(["scripts/sync-ternent-app.mjs", "--", "--app", `apps/${appId}`]);

    assert.match(
      fs.readFileSync(path.join(targetDir, "src", "app", "config", "theme.generated.ts"), "utf8"),
      /ternent-ui\/themes\/prism\.css/,
    );
    assert.match(
      fs.readFileSync(path.join(targetDir, "tsconfig.json"), "utf8"),
      /"extends": "\.\.\/\.\.\/tsconfig\.json"/,
    );
    assert.equal(fs.readFileSync(customFile, "utf8"), "leave me alone");
  } finally {
    removeDir(targetDir);
  }
});
