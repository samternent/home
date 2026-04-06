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
  "appId": "solid",
  "appTitle": "Concord OS for Solid",
  "defaultHost": "solid.ternent.dev",
  "themeName": "concordos",
  "defaultThemeMode": "dark"
} as const satisfies AppConfig;

export const appSeoConfig = {
  "shortName": "Concord OS",
  "description": "Concord OS for Solid is a platform shell for exploring Pod files, opening replayable ledgers, and launching registry-backed apps.",
  "themeColor": "#7ea7d6",
  "backgroundColor": "#0f141b",
  "lang": "en"
} as const satisfies AppSeoConfig;

export const appThemeName = "concordos";

export const appThemePrefix = appThemeName;

export const landingPageConfig = {
  "navigationLinks": [
    {
      "href": "#features",
      "label": "Features"
    },
    {
      "href": "#how-it-works",
      "label": "Workflow"
    },
    {
      "href": "#use-cases",
      "label": "Uses"
    },
    {
      "href": "#developers",
      "label": "Developers"
    }
  ],
  "hero": {
    "eyebrow": "concord os for solid",
    "title": "A Concord OS for the ledgers, files, and apps in your Solid Pod.",
    "description": "Concord OS for Solid is a platform shell for browsing Pod files, opening replayable Concord ledgers, and running registry-backed apps against portable history. The shell owns login, loading, saving, and app lifecycle so individual tools do not need to own your storage model.",
    "supportingLine": "One Pod. Many ledgers. Multiple apps over the same portable history.",
    "note": "Phase 1 ships the landing page, Solid login gate, and the first authenticated shell surface.",
    "primaryAction": {
      "href": "/app",
      "label": "Open app",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/apps/solid",
      "label": "View source",
      "variant": "secondary"
    },
    "preview": {
      "title": "Platform shell",
      "meta": "solid login → files → ledgers → apps",
      "statusLabel": "Phase 1",
      "statusTone": "neutral",
      "rows": [
        {
          "label": "Auth",
          "value": "Solid OIDC",
          "valueTone": "primary"
        },
        {
          "label": "Storage",
          "value": "Pod files",
          "valueTone": "secondary"
        },
        {
          "label": "Data",
          "value": "Concord ledgers",
          "valueTone": "accent"
        },
        {
          "label": "Runtime",
          "value": "registry-backed apps",
          "valueTone": "success"
        }
      ],
      "footerText": "Concord OS for Solid will treat the Pod like a workspace surface. Files remain in Solid, ledgers remain portable, and apps plug into the shell rather than owning the persistence story outright."
    }
  },
  "featureSection": {
    "eyebrow": "Features",
    "title": "Platform concerns live in one shell",
    "description": "Concord OS for Solid is not another app-specific frontend. It is the shared operating layer that can discover storage, load ledgers, and host compatible experiences over the same Pod data.",
    "items": [
      {
        "title": "Filesystem over Pod storage",
        "description": "Navigate Solid storage as a durable workspace instead of hiding data behind one app at a time.",
        "tone": "primary",
        "icon": "stack"
      },
      {
        "title": "Multi-ledger workspace",
        "description": "Keep multiple Concord ledgers side by side and open them intentionally when context changes.",
        "tone": "info",
        "icon": "dataset"
      },
      {
        "title": "Registry-backed apps",
        "description": "Let compatible apps attach to the same ledger instead of forcing one ledger to belong to one interface forever.",
        "tone": "accent",
        "icon": "grid"
      },
      {
        "title": "Shared lifecycle orchestration",
        "description": "The shell handles login, loading, saving, and future plugin mounting so app surfaces can stay focused on domain workflows.",
        "tone": "success",
        "icon": "terminal"
      }
    ]
  },
  "howItWorksSection": {
    "eyebrow": "Workflow",
    "title": "Sign in once, then move through files, ledgers, and apps",
    "preview": {
      "title": "Shell model",
      "meta": "session + registry + ledger host",
      "rows": [
        {
          "label": "1",
          "value": "Sign in with Solid",
          "valueTone": "primary"
        },
        {
          "label": "2",
          "value": "Discover workspace resources",
          "valueTone": "accent"
        },
        {
          "label": "3",
          "value": "Open a ledger in the right app",
          "valueTone": "success"
        }
      ],
      "footerText": "The operating shell becomes the stable entrypoint. Specific apps can come and go as long as they can speak to the files and ledgers behind them."
    },
    "steps": [
      {
        "title": "Authenticate against Solid",
        "description": "Use Solid OIDC to establish the session the shell will carry across workspace interactions."
      },
      {
        "title": "Inspect Pod resources",
        "description": "Present storage as a navigable surface so ledgers and supporting files are visible and movable."
      },
      {
        "title": "Resolve compatible apps",
        "description": "Match files and ledgers to registered app experiences instead of hard-coding one UI for one dataset."
      },
      {
        "title": "Mount the right workspace",
        "description": "Load a focused app surface inside the shell while keeping lifecycle and persistence at the platform layer."
      }
    ]
  },
  "useCasesSection": {
    "eyebrow": "Uses",
    "title": "Built for interoperable ledger work, not just one app",
    "items": [
      {
        "title": "Personal operating layer",
        "description": "Keep a persistent workspace around the files and histories that matter to you across multiple Solid apps.",
        "tone": "primary",
        "icon": "globe"
      },
      {
        "title": "Interoperable ledger apps",
        "description": "Let one ledger support more than one interface when different tools can interpret the same history.",
        "tone": "secondary",
        "icon": "shield"
      },
      {
        "title": "Portable team workspaces",
        "description": "Keep shared files and replayable ledgers in Solid instead of binding collaboration to one hosted product.",
        "tone": "accent",
        "icon": "check"
      },
      {
        "title": "Plugin-hosted vertical tools",
        "description": "Add focused apps for tasks, notes, cases, or operations without replacing the shell that owns persistence and navigation.",
        "tone": "info",
        "icon": "terminal"
      },
      {
        "title": "Ledger-first product prototypes",
        "description": "Explore UI ideas over the same replayable history before deciding which app surface should become primary.",
        "tone": "primary",
        "icon": "stack"
      },
      {
        "title": "Cross-app migrations",
        "description": "Move between compatible surfaces without rewriting or exporting the underlying ledger every time.",
        "tone": "success",
        "icon": "dataset"
      }
    ]
  },
  "developerSection": {
    "eyebrow": "Developers",
    "title": "Build app surfaces on top of Solid sessions and portable ledgers",
    "description": "Concord OS for Solid is a host environment. Use the shell for Solid session lifecycle and storage conventions, then compose domain apps on top of compatible ledgers and plugin contracts.",
    "surfaces": [
      "Solid session",
      "Ledger host",
      "Plugin apps"
    ],
    "tabs": [
      {
        "value": "shell",
        "label": "Shell",
        "title": "Create a Solid-backed Concord app",
        "meta": "TypeScript",
        "code": "import { createSolidConcordApp } from \"@ternent/solid\"\nimport { taskPlugin } from \"@ternent/concord-plugin-task\"\n\nconst { app } = await createSolidConcordApp({\n  session: solidSession,\n  plugins: [taskPlugin()],\n  profile: {\n    enabled: true,\n    discover: true,\n  },\n})\n\nawait app.load()",
        "supportingCopy": "The shell can authenticate with Solid, resolve app resources, and then hand compatible ledgers to focused domain plugins.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/solid",
          "label": "Explore @ternent/solid"
        }
      },
      {
        "value": "registry",
        "label": "Registry",
        "title": "Keep apps decoupled from storage ownership",
        "meta": "Concept",
        "code": "file system → ledger selection → app resolution\n\nshell owns:\n  - Solid login\n  - resource discovery\n  - save/load lifecycle\n  - plugin mounting\n\napps own:\n  - domain commands\n  - replay logic\n  - focused UI",
        "supportingCopy": "The shell should stay boring and durable. Apps should stay focused and replaceable.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/apps/solid",
          "label": "View app source"
        }
      }
    ]
  },
  "clarifierSection": {
    "eyebrow": "Definition",
    "title": "What Concord OS for Solid is and isn’t",
    "columns": [
      {
        "title": "This template is",
        "items": [
          "A platform shell for Solid-backed files, ledgers, and apps",
          "A place to keep lifecycle and storage concerns above individual apps",
          "A Concord-oriented operating layer for replayable history"
        ]
      },
      {
        "title": "This template is not",
        "items": [
          "A replacement for Solid itself",
          "A promise that every file already has a compatible app surface",
          "A finished filesystem or plugin runtime in phase 1"
        ]
      }
    ]
  },
  "ctaSection": {
    "eyebrow": "Phase 1",
    "title": "Sign in with Solid and start shaping the shell.",
    "description": "Enter the first authenticated Concord OS surface now, then grow the filesystem, ledger browser, and app registry on top of the same Solid session model.",
    "primaryAction": {
      "href": "/app",
      "label": "Open app",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/apps/solid",
      "label": "View source",
      "variant": "secondary"
    }
  },
  "footer": {
    "brandLabel": "ternent.dev",
    "brandHref": "https://ternent.dev",
    "copyright": "© 2026.",
    "links": [
      {
        "href": "/app",
        "label": "App"
      },
      {
        "href": "/settings/appearance",
        "label": "Appearance"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/apps/solid",
        "label": "GitHub"
      },
      {
        "href": "https://github.com/samternent/home",
        "label": "Monorepo"
      }
    ]
  }
} as const satisfies LandingPageConfig;
