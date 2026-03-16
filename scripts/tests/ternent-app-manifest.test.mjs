import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createScaffoldManifest,
  createDeployWorkflowSource,
  deriveThemeMeta,
  getAvailableThemeNames,
  getVercelProjectSecretName,
  loadTernentAppManifest,
  loadTernentAppManifestForDir,
  updatePublishScriptSource,
} from "../lib/ternent-app-manifest.mjs";

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);

test("loads the seal manifest into normalized runtime config", () => {
  const manifest = loadTernentAppManifestForDir(path.join(repoRoot, "apps", "seal"), repoRoot);

  assert.equal(manifest.app.appId, "seal");
  assert.equal(manifest.app.themeName, "proof");
  assert.equal(manifest.app.defaultThemeMode, "dark");
  assert.equal(manifest.landing.developerSection.tabs[0].value, "js");
  assert.equal(manifest.landing.featureSection.items.length, 4);
});

test("rejects a manifest with an unknown ternent-ui theme", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ternent-app-manifest-"));
  const manifestPath = path.join(tmpDir, "app.yaml");
  fs.writeFileSync(
    manifestPath,
    `app:
  id: invalid-theme-app
  title: Invalid Theme
  host: invalid.ternent.dev
  themeName: no-such-theme
  defaultThemeMode: dark
seo:
  description: Invalid
landing:
  navigationLinks:
    - href: "#features"
      label: Features
  hero:
    eyebrow: ternent.dev
    title: Invalid
    description: Invalid
    primaryAction:
      href: /
      label: Home
    preview:
      title: Preview
      rows:
        - label: Status
          value: Broken
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
      href: /
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

  assert.throws(
    () => loadTernentAppManifest(manifestPath, repoRoot),
    /app\.themeName must match an existing ternent-ui theme/,
  );
});

test("synthesizes a minimal scaffold manifest with derived theme metadata", () => {
  const manifest = createScaffoldManifest({
    repoRoot,
    name: "sample-app",
    title: "Sample App",
    host: "sample.ternent.dev",
    themeName: "harbor-rose",
  });

  const themeMeta = deriveThemeMeta(repoRoot, "harbor-rose", "dark");

  assert.equal(manifest.app.appId, "sample-app");
  assert.equal(manifest.app.themeName, "harbor-rose");
  assert.equal(manifest.seo.themeColor, themeMeta.themeColor);
  assert.equal(manifest.seo.backgroundColor, themeMeta.backgroundColor);
  assert.ok(getAvailableThemeNames(repoRoot).includes("harbor-rose"));
});

test("builds a deploy workflow for scaffolded apps", () => {
  const manifest = createScaffoldManifest({
    repoRoot,
    name: "receipt-checker",
    title: "Receipt Checker",
    host: "receipt-checker.ternent.dev",
    themeName: "aurora",
  });

  const workflow = createDeployWorkflowSource(manifest);

  assert.equal(
    getVercelProjectSecretName("receipt-checker"),
    "VERCEL_RECEIPT_CHECKER_PROJECT_ID",
  );
  assert.match(workflow, /name: Release receipt-checker\.ternent\.dev/);
  assert.match(workflow, /tags:\n\s+- "receipt-checker-\*\.\*\.\*"/);
  assert.match(workflow, /apps\/receipt-checker\/\.vercel\/output\/static/);
});

test("adds scaffolded apps to the publish script once", () => {
  const source = `const appsToPublish = [\n  "../apps/seal",\n];\n`;

  const once = updatePublishScriptSource(source, "armour");
  const twice = updatePublishScriptSource(once, "armour");

  assert.match(once, /\.\.\/apps\/armour/);
  assert.equal(once, twice);
});
