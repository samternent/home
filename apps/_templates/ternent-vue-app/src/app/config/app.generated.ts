import type { LandingPageConfig } from "ternent-ui/patterns";

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

export const appConfig = {
  "appId": "ternent-app",
  "appTitle": "Ternent Launchpad",
  "defaultHost": "launchpad.ternent.dev",
  "themeName": "aurora",
  "defaultThemeMode": "dark"
} as const satisfies AppConfig;

export const appSeoConfig = {
  "shortName": "Launchpad",
  "description": "Launch a branded ternent landing page and settings shell from a single YAML manifest.",
  "themeColor": "#67e8f9",
  "backgroundColor": "#0b1217",
  "lang": "en"
} as const satisfies AppSeoConfig;

export const appThemeName = "aurora";

export const appThemePrefix = appThemeName;

export const landingPageConfig = {
  "navigationLinks": [
    {
      "href": "#features",
      "label": "Features"
    },
    {
      "href": "#how-it-works",
      "label": "How it works"
    },
    {
      "href": "#use-cases",
      "label": "Use cases"
    },
    {
      "href": "#developers",
      "label": "Developers"
    }
  ],
  "hero": {
    "eyebrow": "ternent.dev",
    "title": "Launch a branded ternent app fast.",
    "description": "Start from the same design-system-led landing skeleton, keep the settings baseline, and replace the whole front page from YAML.",
    "primaryAction": {
      "href": "/settings",
      "label": "Open settings",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/apps/_templates/ternent-vue-app",
      "label": "View template",
      "variant": "secondary"
    },
    "preview": {
      "title": "App manifest",
      "meta": "app.yaml",
      "statusLabel": "Ready to scaffold",
      "statusTone": "info",
      "rows": [
        {
          "label": "Theme",
          "value": "aurora-dark",
          "valueTone": "primary"
        },
        {
          "label": "Surface",
          "value": "Landing + settings baseline",
          "valueTone": "secondary"
        },
        {
          "label": "Input",
          "value": "YAML source of truth",
          "valueTone": "accent"
        },
        {
          "label": "Output",
          "value": "Generated runtime config",
          "valueTone": "success"
        }
      ],
      "footerText": "Edit the manifest, sync the generated config, and ship a branded static landing page without rewriting the route."
    }
  },
  "featureSection": {
    "eyebrow": "Features",
    "title": "Template-ready and on-brand",
    "description": "The scaffold starts with current ternent-ui primitives and patterns instead of the older legacy component layer.",
    "items": [
      {
        "title": "Config-driven copy",
        "description": "Update headlines, links, snippets, and calls to action from a single manifest.",
        "tone": "primary",
        "icon": "document"
      },
      {
        "title": "DS themes only",
        "description": "Pick an existing ternent-ui theme and keep visual consistency across new launches.",
        "tone": "info",
        "icon": "spark"
      },
      {
        "title": "Settings included",
        "description": "Keep identity and appearance routes so each new app starts from a practical baseline.",
        "tone": "accent",
        "icon": "grid"
      },
      {
        "title": "Preview surfaces",
        "description": "Ship developer snippets and technical panels without custom product code in the landing shell.",
        "tone": "success",
        "icon": "terminal"
      }
    ]
  },
  "howItWorksSection": {
    "eyebrow": "How it works",
    "title": "Ship a new landing page in one pass",
    "preview": {
      "title": "Scaffold workflow",
      "meta": "sync + scaffold",
      "rows": [
        {
          "label": "1",
          "value": "Author app.yaml",
          "valueTone": "primary"
        },
        {
          "label": "2",
          "value": "Sync generated config",
          "valueTone": "accent"
        },
        {
          "label": "3",
          "value": "Run the app",
          "valueTone": "success"
        }
      ],
      "footerText": "Runtime routes consume generated TS config. The browser never parses YAML directly."
    },
    "steps": [
      {
        "title": "Define the manifest",
        "description": "Set app metadata, select a ternent-ui theme, and fill in the landing-page sections."
      },
      {
        "title": "Generate runtime config",
        "description": "Run the sync command to emit the typed config module and theme import for the app."
      },
      {
        "title": "Launch and iterate",
        "description": "Start the app, tweak copy in YAML, and resync without reworking the route structure."
      }
    ]
  },
  "useCasesSection": {
    "eyebrow": "Use cases",
    "title": "Built for repeat launches",
    "items": [
      {
        "title": "Product microsites",
        "description": "Stand up a branded front door for a new tool without inventing another page structure.",
        "tone": "primary",
        "icon": "globe"
      },
      {
        "title": "Private betas",
        "description": "Pair launch copy with identity flows and settings screens for early access distributions.",
        "tone": "secondary",
        "icon": "shield"
      },
      {
        "title": "Internal tools",
        "description": "Give operational apps a polished home page before users ever enter the workspace.",
        "tone": "accent",
        "icon": "check"
      },
      {
        "title": "CLI companions",
        "description": "Publish install snippets, workflows, and technical callouts alongside your product.",
        "tone": "info",
        "icon": "terminal"
      },
      {
        "title": "Partner portals",
        "description": "Swap theme and copy while preserving the same structure, spacing, and motion language.",
        "tone": "primary",
        "icon": "stack"
      },
      {
        "title": "Docs launchpads",
        "description": "Use previews and step lists to frame the next action before users reach deeper content.",
        "tone": "success",
        "icon": "dataset"
      }
    ]
  },
  "developerSection": {
    "eyebrow": "Developers",
    "title": "The same skeleton adapts to app, CLI, and docs messaging",
    "description": "Landing pages can explain product workflows, runtime setup, or integration surfaces without bespoke layout work.",
    "surfaces": [
      "Web app",
      "CLI",
      "Docs"
    ],
    "tabs": [
      {
        "value": "yaml",
        "label": "Manifest",
        "title": "Manifest-first app setup",
        "meta": "YAML",
        "code": "app:\n  id: my-app\n  title: My App\n  host: my-app.ternent.dev\n  themeName: aurora\n  defaultThemeMode: dark",
        "supportingCopy": "Keep metadata, theme choice, and landing content in one file so the scaffold can regenerate the runtime config safely.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/apps/_templates/ternent-vue-app",
          "label": "Open the template source"
        }
      },
      {
        "value": "sync",
        "label": "Sync",
        "title": "Regenerate app config from the manifest",
        "meta": "CLI",
        "code": "pnpm sync:ternent-app -- --app apps/my-app\npnpm --filter my-app dev",
        "supportingCopy": "The sync command writes the typed config module and theme import without forcing you to resculpt the route tree.",
        "link": {
          "href": "https://github.com/samternent/home/blob/main/scripts/sync-ternent-app.mjs",
          "label": "View the sync script"
        }
      },
      {
        "value": "scaffold",
        "label": "Scaffold",
        "title": "Create a new app from a manifest",
        "meta": "CLI",
        "code": "pnpm scaffold:ternent-app -- --manifest apps/my-app/app.yaml",
        "supportingCopy": "Use a full manifest when you know the product shape, or keep the shorthand flags for a minimal launch scaffold.",
        "link": {
          "href": "https://github.com/samternent/home/blob/main/scripts/scaffold-ternent-app.mjs",
          "label": "View the scaffold script"
        }
      }
    ]
  },
  "clarifierSection": {
    "eyebrow": "Definition",
    "title": "What this template is and isn’t",
    "columns": [
      {
        "title": "This template is",
        "items": [
          "A config-driven landing-page skeleton",
          "A practical baseline with settings and identity flows",
          "A way to stay inside ternent-ui conventions"
        ]
      },
      {
        "title": "This template is not",
        "items": [
          "A custom theme generator",
          "A domain-specific marketing site builder",
          "A replacement for app-specific workspace code"
        ]
      }
    ]
  },
  "ctaSection": {
    "eyebrow": "Ready to start?",
    "title": "Scaffold the next ternent app from YAML",
    "description": "Pick a theme, update the copy, sync the config, and launch with the current design-system conventions already in place.",
    "primaryAction": {
      "href": "/settings",
      "label": "Open settings",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/apps/_templates/ternent-vue-app",
      "label": "Inspect template",
      "variant": "secondary"
    }
  },
  "footer": {
    "brandLabel": "Ternent Launchpad",
    "brandHref": "https://ternent.dev",
    "copyright": "© 2026.",
    "links": [
      {
        "href": "/",
        "label": "Home"
      },
      {
        "href": "/settings",
        "label": "Settings"
      },
      {
        "href": "/settings/appearance",
        "label": "Appearance"
      },
      {
        "href": "https://github.com/samternent/home",
        "label": "Monorepo"
      }
    ]
  }
} as const satisfies LandingPageConfig;
