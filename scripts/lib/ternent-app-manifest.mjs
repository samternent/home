import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export const CANONICAL_APP_MANIFEST = "app.yaml";

function assertObject(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }
}

function assertString(value, message) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(message);
  }
  return value.trim();
}

function assertArray(value, message) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(message);
  }
  return value;
}

function toJson(value) {
  return JSON.stringify(value, null, 2);
}

function getThemeDir(repoRoot) {
  return path.join(repoRoot, "packages", "ternent-ui", "src", "themes");
}

export function getAvailableThemeNames(repoRoot) {
  return fs
    .readdirSync(getThemeDir(repoRoot))
    .filter((entry) => entry.endsWith(".css"))
    .map((entry) => entry.replace(/\.css$/, ""))
    .filter((name) => name !== "semanticThemeContract")
    .sort();
}

function parseThemeTokens(css, selector) {
  const match = css.match(new RegExp(`\\[data-theme="${selector}"\\]\\s*\\{([\\s\\S]*?)\\}`));
  if (!match) return {};

  return Object.fromEntries(
    Array.from(match[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)).map(([, key, value]) => [
      key,
      value.trim(),
    ]),
  );
}

export function deriveThemeMeta(repoRoot, themeName, mode) {
  const themeFile = path.join(getThemeDir(repoRoot), `${themeName}.css`);
  if (!fs.existsSync(themeFile)) {
    throw new Error(`Unknown ternent-ui theme "${themeName}".`);
  }

  const css = fs.readFileSync(themeFile, "utf8");
  const tokens = parseThemeTokens(css, `${themeName}-${mode}`);

  return {
    themeColor: tokens["--ui-primary"] || "#0e1321",
    backgroundColor: tokens["--ui-bg"] || "#0b101b",
  };
}

function normalizeLink(value, context) {
  assertObject(value, `${context} must be an object.`);
  return {
    href: assertString(value.href, `${context}.href is required.`),
    label: assertString(value.label, `${context}.label is required.`),
  };
}

function normalizeAction(value, context) {
  const link = normalizeLink(value, context);
  const variant = value.variant === "secondary" ? "secondary" : "primary";

  return {
    ...link,
    variant,
  };
}

function normalizePreviewRows(value, context) {
  if (!value) return undefined;

  return assertArray(value, `${context} must be a non-empty array.`).map((row, index) => {
    assertObject(row, `${context}[${index}] must be an object.`);
    return {
      label: assertString(row.label, `${context}[${index}].label is required.`),
      value: assertString(row.value, `${context}[${index}].value is required.`),
      valueTone:
        typeof row.valueTone === "string" && row.valueTone.length > 0
          ? row.valueTone
          : undefined,
    };
  });
}

function normalizePreviewTabs(value, context) {
  if (!value) return undefined;

  return assertArray(value, `${context} must be a non-empty array.`).map((tab, index) => {
    assertObject(tab, `${context}[${index}] must be an object.`);
    return {
      label: assertString(tab.label, `${context}[${index}].label is required.`),
      active: Boolean(tab.active),
    };
  });
}

function normalizePreview(value, context) {
  assertObject(value, `${context} must be an object.`);

  const rows = normalizePreviewRows(value.rows, `${context}.rows`);
  const code =
    typeof value.code === "string" && value.code.trim().length > 0
      ? value.code.replace(/\r\n/g, "\n")
      : undefined;

  if (!rows && !code) {
    throw new Error(`${context} must define rows or code.`);
  }

  return {
    title: typeof value.title === "string" ? value.title.trim() : undefined,
    meta: typeof value.meta === "string" ? value.meta.trim() : undefined,
    statusLabel:
      typeof value.statusLabel === "string" ? value.statusLabel.trim() : undefined,
    statusTone:
      typeof value.statusTone === "string" ? value.statusTone.trim() : undefined,
    rows,
    code,
    tabs: normalizePreviewTabs(value.tabs, `${context}.tabs`),
    footerText:
      typeof value.footerText === "string" ? value.footerText.trim() : undefined,
  };
}

function normalizeFeatureList(value, context) {
  return assertArray(value, `${context} must be a non-empty array.`).map((item, index) => {
    assertObject(item, `${context}[${index}] must be an object.`);
    return {
      title: assertString(item.title, `${context}[${index}].title is required.`),
      description: assertString(
        item.description,
        `${context}[${index}].description is required.`,
      ),
      tone: typeof item.tone === "string" ? item.tone.trim() : "primary",
      icon: typeof item.icon === "string" ? item.icon.trim() : "spark",
    };
  });
}

function normalizeStepList(value, context) {
  return assertArray(value, `${context} must be a non-empty array.`).map((item, index) => {
    assertObject(item, `${context}[${index}] must be an object.`);
    return {
      title: assertString(item.title, `${context}[${index}].title is required.`),
      description: assertString(
        item.description,
        `${context}[${index}].description is required.`,
      ),
    };
  });
}

function normalizeStringList(value, context) {
  return assertArray(value, `${context} must be a non-empty array.`).map((item, index) =>
    assertString(item, `${context}[${index}] must be a string.`),
  );
}

function normalizeDeveloperTabs(value, context) {
  return assertArray(value, `${context} must be a non-empty array.`).map((tab, index) => {
    assertObject(tab, `${context}[${index}] must be an object.`);
    return {
      value: assertString(tab.value, `${context}[${index}].value is required.`),
      label: assertString(tab.label, `${context}[${index}].label is required.`),
      title: assertString(tab.title, `${context}[${index}].title is required.`),
      meta: assertString(tab.meta, `${context}[${index}].meta is required.`),
      code: assertString(tab.code, `${context}[${index}].code is required.`).replace(
        /\r\n/g,
        "\n",
      ),
      supportingCopy: assertString(
        tab.supportingCopy,
        `${context}[${index}].supportingCopy is required.`,
      ),
      link: normalizeLink(tab.link, `${context}[${index}].link`),
    };
  });
}

function normalizeColumns(value, context) {
  return assertArray(value, `${context} must be a non-empty array.`).map((column, index) => {
    assertObject(column, `${context}[${index}] must be an object.`);
    return {
      title: assertString(column.title, `${context}[${index}].title is required.`),
      items: normalizeStringList(column.items, `${context}[${index}].items`),
    };
  });
}

function normalizeLanding(rawLanding) {
  assertObject(rawLanding, "landing must be an object.");

  const hero = rawLanding.hero;
  assertObject(hero, "landing.hero must be an object.");

  const featureSection = rawLanding.featureSection;
  assertObject(featureSection, "landing.featureSection must be an object.");

  const howItWorksSection = rawLanding.howItWorksSection;
  assertObject(howItWorksSection, "landing.howItWorksSection must be an object.");

  const useCasesSection = rawLanding.useCasesSection;
  assertObject(useCasesSection, "landing.useCasesSection must be an object.");

  const developerSection = rawLanding.developerSection;
  assertObject(developerSection, "landing.developerSection must be an object.");

  const clarifierSection = rawLanding.clarifierSection;
  assertObject(clarifierSection, "landing.clarifierSection must be an object.");

  const ctaSection = rawLanding.ctaSection;
  assertObject(ctaSection, "landing.ctaSection must be an object.");

  const footer = rawLanding.footer;
  assertObject(footer, "landing.footer must be an object.");

  return {
    navigationLinks: assertArray(
      rawLanding.navigationLinks,
      "landing.navigationLinks must be a non-empty array.",
    ).map((link, index) =>
      normalizeLink(link, `landing.navigationLinks[${index}]`),
    ),
    hero: {
      eyebrow: assertString(hero.eyebrow, "landing.hero.eyebrow is required."),
      title: assertString(hero.title, "landing.hero.title is required."),
      description: assertString(
        hero.description,
        "landing.hero.description is required.",
      ),
      primaryAction: normalizeAction(
        hero.primaryAction,
        "landing.hero.primaryAction",
      ),
      secondaryAction: hero.secondaryAction
        ? normalizeAction(hero.secondaryAction, "landing.hero.secondaryAction")
        : undefined,
      preview: normalizePreview(hero.preview, "landing.hero.preview"),
    },
    featureSection: {
      eyebrow: assertString(
        featureSection.eyebrow,
        "landing.featureSection.eyebrow is required.",
      ),
      title: assertString(
        featureSection.title,
        "landing.featureSection.title is required.",
      ),
      description:
        typeof featureSection.description === "string"
          ? featureSection.description.trim()
          : undefined,
      items: normalizeFeatureList(
        featureSection.items,
        "landing.featureSection.items",
      ),
    },
    howItWorksSection: {
      eyebrow: assertString(
        howItWorksSection.eyebrow,
        "landing.howItWorksSection.eyebrow is required.",
      ),
      title: assertString(
        howItWorksSection.title,
        "landing.howItWorksSection.title is required.",
      ),
      preview: normalizePreview(
        howItWorksSection.preview,
        "landing.howItWorksSection.preview",
      ),
      steps: normalizeStepList(
        howItWorksSection.steps,
        "landing.howItWorksSection.steps",
      ),
    },
    useCasesSection: {
      eyebrow: assertString(
        useCasesSection.eyebrow,
        "landing.useCasesSection.eyebrow is required.",
      ),
      title: assertString(
        useCasesSection.title,
        "landing.useCasesSection.title is required.",
      ),
      items: normalizeFeatureList(
        useCasesSection.items,
        "landing.useCasesSection.items",
      ),
    },
    developerSection: {
      eyebrow: assertString(
        developerSection.eyebrow,
        "landing.developerSection.eyebrow is required.",
      ),
      title: assertString(
        developerSection.title,
        "landing.developerSection.title is required.",
      ),
      description: assertString(
        developerSection.description,
        "landing.developerSection.description is required.",
      ),
      surfaces: normalizeStringList(
        developerSection.surfaces,
        "landing.developerSection.surfaces",
      ),
      tabs: normalizeDeveloperTabs(
        developerSection.tabs,
        "landing.developerSection.tabs",
      ),
    },
    clarifierSection: {
      eyebrow: assertString(
        clarifierSection.eyebrow,
        "landing.clarifierSection.eyebrow is required.",
      ),
      title: assertString(
        clarifierSection.title,
        "landing.clarifierSection.title is required.",
      ),
      columns: normalizeColumns(
        clarifierSection.columns,
        "landing.clarifierSection.columns",
      ),
    },
    ctaSection: {
      eyebrow: assertString(
        ctaSection.eyebrow,
        "landing.ctaSection.eyebrow is required.",
      ),
      title: assertString(
        ctaSection.title,
        "landing.ctaSection.title is required.",
      ),
      description: assertString(
        ctaSection.description,
        "landing.ctaSection.description is required.",
      ),
      primaryAction: normalizeAction(
        ctaSection.primaryAction,
        "landing.ctaSection.primaryAction",
      ),
      secondaryAction: ctaSection.secondaryAction
        ? normalizeAction(
            ctaSection.secondaryAction,
            "landing.ctaSection.secondaryAction",
          )
        : undefined,
    },
    footer: {
      brandLabel: assertString(
        footer.brandLabel,
        "landing.footer.brandLabel is required.",
      ),
      brandHref:
        typeof footer.brandHref === "string" && footer.brandHref.trim().length > 0
          ? footer.brandHref.trim()
          : "/",
      copyright: assertString(
        footer.copyright,
        "landing.footer.copyright is required.",
      ),
      links: assertArray(
        footer.links,
        "landing.footer.links must be a non-empty array.",
      ).map((link, index) => normalizeLink(link, `landing.footer.links[${index}]`)),
    },
  };
}

export function normalizeTernentAppManifest(rawManifest, repoRoot) {
  assertObject(rawManifest, "App manifest must be a YAML object.");

  const app = rawManifest.app;
  const seo = rawManifest.seo;
  const landing = rawManifest.landing;

  assertObject(app, "app must be an object.");
  assertObject(seo, "seo must be an object.");

  const appId = assertString(app.id, "app.id is required.");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(appId)) {
    throw new Error("app.id must be lowercase kebab-case.");
  }

  const themeName = assertString(app.themeName, "app.themeName is required.");
  const availableThemeNames = getAvailableThemeNames(repoRoot);
  if (!availableThemeNames.includes(themeName)) {
    throw new Error(
      `app.themeName must match an existing ternent-ui theme. Received "${themeName}".`,
    );
  }

  const defaultThemeMode = app.defaultThemeMode === "light" ? "light" : "dark";
  const derivedThemeMeta = deriveThemeMeta(repoRoot, themeName, defaultThemeMode);

  return {
    app: {
      appId,
      appTitle: assertString(app.title, "app.title is required."),
      defaultHost: assertString(app.host, "app.host is required."),
      themeName,
      defaultThemeMode,
    },
    seo: {
      shortName:
        typeof seo.shortName === "string" && seo.shortName.trim().length > 0
          ? seo.shortName.trim()
          : assertString(app.title, "app.title is required."),
      description: assertString(seo.description, "seo.description is required."),
      themeColor:
        typeof seo.themeColor === "string" && seo.themeColor.trim().length > 0
          ? seo.themeColor.trim()
          : derivedThemeMeta.themeColor,
      backgroundColor:
        typeof seo.backgroundColor === "string" && seo.backgroundColor.trim().length > 0
          ? seo.backgroundColor.trim()
          : derivedThemeMeta.backgroundColor,
      lang:
        typeof seo.lang === "string" && seo.lang.trim().length > 0
          ? seo.lang.trim()
          : "en",
    },
    landing: normalizeLanding(landing),
  };
}

export function loadTernentAppManifest(manifestPath, repoRoot) {
  const rawSource = fs.readFileSync(manifestPath, "utf8");
  const parsed = YAML.parse(rawSource);
  return normalizeTernentAppManifest(parsed, repoRoot);
}

export function loadTernentAppManifestForDir(appDir, repoRoot) {
  return loadTernentAppManifest(path.join(appDir, CANONICAL_APP_MANIFEST), repoRoot);
}

export function loadTemplateManifest(repoRoot) {
  return loadTernentAppManifest(
    path.join(
      repoRoot,
      "apps",
      "_templates",
      "ternent-vue-app",
      CANONICAL_APP_MANIFEST,
    ),
    repoRoot,
  );
}

function createGeneratedConfigSource(manifest) {
  return `import type { LandingPageConfig } from "ternent-ui/patterns";

export type ThemeMode = "light" | "dark";

export type AppConfig = {
  appId: string;
  appTitle: string;
  defaultHost: string;
  themeName: string;
  defaultThemeMode: ThemeMode;
};

export type AppSeoConfig = {
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  lang: string;
};

export const appConfig = ${toJson(manifest.app)} as const satisfies AppConfig;

export const appSeoConfig = ${toJson(manifest.seo)} as const satisfies AppSeoConfig;

export const appThemeName = ${JSON.stringify(manifest.app.themeName)};

export const appThemePrefix = appThemeName;

export const landingPageConfig = ${toJson(
    manifest.landing,
  )} as const satisfies LandingPageConfig;
`;
}

function createGeneratedThemeSource(manifest) {
  return `import "ternent-ui/themes/${manifest.app.themeName}.css";
`;
}

export function writeGeneratedAppFiles(appDir, manifest) {
  const configDir = path.join(appDir, "src", "app", "config");
  fs.mkdirSync(configDir, { recursive: true });

  fs.writeFileSync(
    path.join(configDir, "app.generated.ts"),
    createGeneratedConfigSource(manifest),
    "utf8",
  );

  fs.writeFileSync(
    path.join(configDir, "theme.generated.ts"),
    createGeneratedThemeSource(manifest),
    "utf8",
  );
}

export function normalizeScaffoldedAppFiles(appDir, repoRoot) {
  const tsconfigPath = path.join(appDir, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    const repoTsconfigPath = path.join(repoRoot, "tsconfig.json");
    const extendsPath = path.relative(appDir, repoTsconfigPath).replaceAll(path.sep, "/");

    const source = fs.readFileSync(tsconfigPath, "utf8");
    const next = source.replace(
      /"extends":\s*"[^"]+"/,
      `"extends": "${extendsPath}"`,
    );

    if (next !== source) {
      fs.writeFileSync(tsconfigPath, next, "utf8");
    }
  }

  const viteConfigPath = path.join(appDir, "vite.config.ts");
  if (fs.existsSync(viteConfigPath)) {
    const sealCliProofPath = path
      .relative(appDir, path.join(repoRoot, "packages", "seal-cli", "src", "proof.ts"))
      .replaceAll(path.sep, "/");

    const source = fs.readFileSync(viteConfigPath, "utf8");
    const next = source.replace(
      /@ternent\/seal-cli\/proof": resolve\(\s*__dirname,\s*"[^"]+",\s*\)/m,
      `@ternent/seal-cli/proof": resolve(\n        __dirname,\n        "${sealCliProofPath}",\n      )`,
    );

    if (next !== source) {
      fs.writeFileSync(viteConfigPath, next, "utf8");
    }
  }
}

export function createScaffoldManifest({
  repoRoot,
  name,
  title,
  host,
  themeName,
}) {
  const base = loadTemplateManifest(repoRoot);
  const nextThemeName = themeName || base.app.themeName;
  const derivedThemeMeta = deriveThemeMeta(
    repoRoot,
    nextThemeName,
    base.app.defaultThemeMode,
  );

  return {
    app: {
      ...base.app,
      appId: name,
      appTitle: title,
      defaultHost: host,
      themeName: nextThemeName,
    },
    seo: {
      ...base.seo,
      shortName: title,
      description: `${title} built on the Ternent Vue landing template.`,
      themeColor: derivedThemeMeta.themeColor,
      backgroundColor: derivedThemeMeta.backgroundColor,
    },
    landing: {
      ...base.landing,
      hero: {
        ...base.landing.hero,
        eyebrow: host,
        title: `${title} launches fast.`,
        description:
          "Start from the same on-brand ternent landing skeleton, switch the theme, and replace the copy from YAML.",
      },
      footer: {
        ...base.landing.footer,
        links: [
          {
            href: "/settings",
            label: "Settings",
          },
          {
            href: "/settings/identity",
            label: "Identity",
          },
          {
            href: `https://github.com/samternent/home/tree/main/apps/${name}`,
            label: "GitHub",
          },
          {
            href: "https://github.com/samternent/home",
            label: "Monorepo",
          },
        ],
      },
    },
  };
}

export function stringifyManifestYaml(manifest) {
  return YAML.stringify({
    app: {
      id: manifest.app.appId,
      title: manifest.app.appTitle,
      host: manifest.app.defaultHost,
      themeName: manifest.app.themeName,
      defaultThemeMode: manifest.app.defaultThemeMode,
    },
    seo: manifest.seo,
    landing: manifest.landing,
  });
}

export function createIndexHtmlTransformPlugin(manifest) {
  return {
    name: "ternent-app-index-html",
    transformIndexHtml(html) {
      return html
        .replaceAll("__APP_LANG__", manifest.seo.lang)
        .replaceAll("__APP_TITLE__", manifest.app.appTitle)
        .replaceAll("__APP_DESCRIPTION__", manifest.seo.description)
        .replaceAll("__APP_THEME_COLOR__", manifest.seo.themeColor)
        .replaceAll(
          "__APP_THEME_DATA__",
          `${manifest.app.themeName}-${manifest.app.defaultThemeMode}`,
        );
    },
  };
}

export function createPwaManifest(manifest) {
  return {
    id: "/",
    name: manifest.app.appTitle,
    short_name: manifest.seo.shortName,
    description: manifest.seo.description,
    theme_color: manifest.seo.themeColor,
    background_color: manifest.seo.backgroundColor,
    display: "standalone",
    start_url: "/",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

function getDeployWorkflowPath(repoRoot, appId) {
  return path.join(repoRoot, ".github", "workflows", `deploy-${appId}.yml`);
}

function getPublishScriptPath(repoRoot) {
  return path.join(repoRoot, ".ops", "publish.mjs");
}

export function getVercelProjectSecretName(appId) {
  return `VERCEL_${appId.replaceAll("-", "_").toUpperCase()}_PROJECT_ID`;
}

export function createDeployWorkflowSource(manifest) {
  const { appId, defaultHost } = manifest.app;
  const projectSecretName = getVercelProjectSecretName(appId);

  return `name: Release ${defaultHost}
env:
  VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: \${{ secrets.${projectSecretName} }}
  PNPM_CACHE_PATH: ~/.pnpm-store
  PNPM_CACHE_NAME: pnpm-store-cache
  SEAL_PRIVATE_KEY: \${{ secrets.SEAL_PRIVATE_KEY }}
  SEAL_PUBLIC_KEY: \${{ secrets.SEAL_PUBLIC_KEY }}
on:
  push:
    tags:
      - "${appId}-*.*.*"

jobs:
  Deploy-Production:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@master
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Get branch name
        id: branch
        run: |
          echo "branch_name=$(echo \${GITHUB_REF#refs/heads/} | tr / -)" >> $GITHUB_ENV

      - name: Get node version
        id: nvmrc
        run: echo ::set-output name=NODE_VERSION::$(cat .nvmrc)

      - name: Setup PNPM
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install Vercel CLI
        run: pnpm install --global vercel@latest

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build ${appId} app
        run: pnpm --filter ternent-ui --filter ternent-utils --filter ternent-identity --filter ${appId} build

      - name: Link Vercel project
        run: vercel link --yes --cwd \${{ github.workspace }}/apps/${appId} --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --cwd \${{ github.workspace }}/apps/${appId} --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Build Vercel Environment Information
        run: vercel build --prod --cwd \${{ github.workspace }}/apps/${appId} --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Generate sealed site artifacts
        uses: samternent/seal-action@v1
        with:
          assets-directory: apps/${appId}/.vercel/output/static

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --cwd \${{ github.workspace }}/apps/${appId} --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Update app version in Redis
        run: node .ops/update-redis-version.mjs
        env:
          REDIS_PASSWORD: \${{ secrets.REDIS_PASSWORD }}
          REDIS_ENDPOINT_URI: \${{ secrets.REDIS_ENDPOINT_URI }}
`;
}

export function updatePublishScriptSource(source, appId) {
  const nextEntry = `../apps/${appId}`;
  const arrayPattern = /const appsToPublish = \[(?<body>[\s\S]*?)\n\];/;
  const match = source.match(arrayPattern);

  if (!match?.groups?.body) {
    throw new Error("Unable to locate appsToPublish array in .ops/publish.mjs");
  }

  const currentEntries = Array.from(
    match.groups.body.matchAll(/"([^"]+)"/g),
    ([, entry]) => entry,
  );

  if (currentEntries.includes(nextEntry)) {
    return source;
  }

  const nextEntries = [...currentEntries, nextEntry].sort((left, right) =>
    left.localeCompare(right),
  );

  return source.replace(
    arrayPattern,
    `const appsToPublish = [\n${nextEntries.map((entry) => `  "${entry}",`).join("\n")}\n];`,
  );
}

export function writeScaffoldReleaseFiles(repoRoot, manifest) {
  const workflowPath = getDeployWorkflowPath(repoRoot, manifest.app.appId);
  fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
  fs.writeFileSync(workflowPath, createDeployWorkflowSource(manifest), "utf8");

  const publishScriptPath = getPublishScriptPath(repoRoot);
  const publishSource = fs.readFileSync(publishScriptPath, "utf8");
  const nextPublishSource = updatePublishScriptSource(
    publishSource,
    manifest.app.appId,
  );

  if (nextPublishSource !== publishSource) {
    fs.writeFileSync(publishScriptPath, nextPublishSource, "utf8");
  }
}
