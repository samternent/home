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
  "appId": "concord",
  "appTitle": "Concord - A command-first runtime for verifiable, non-custodial applications.",
  "defaultHost": "concord.ternent.dev",
  "themeName": "concord",
  "defaultThemeMode": "dark"
} as const satisfies AppConfig;

export const appSeoConfig = {
  "shortName": "Concord",
  "description": "Concord is a command-first runtime for building verifiable, non-custodial applications on top of Ledger and signed commit history.",
  "themeColor": "#7ea7d6",
  "backgroundColor": "#0f141b",
  "lang": "en"
} as const satisfies AppSeoConfig;

export const appThemeName = "concord";

export const appThemePrefix = appThemeName;

export const landingPageConfig = {
  "navigationLinks": [
    {
      "href": "#proof-model",
      "label": "The Runtime"
    },
    {
      "href": "#proof-json",
      "label": "Ledger Artifact"
    },
    {
      "href": "#surfaces",
      "label": "Surfaces"
    },
    {
      "href": "#static-build",
      "label": "Example Use"
    },
    {
      "href": "#developers",
      "label": "Developers"
    }
  ],
  "hero": {
    "eyebrow": "concord",
    "title": "Build apps from signed history, not trusted storage.",
    "description": "Concord is a command-first runtime for developers who want application state to be derived, verifiable, and portable. It sits above Ledger and turns signed, append-only commit history into real, usable app state through commands, explicit commits, deterministic replay, and plugin projections.",
    "supportingLine": "Stage intent locally. Commit when you mean it. Rebuild state from replay. Keep storage dumb.",
    "note": "Concord is the engine. Ledger preserves truth. Concord turns that truth into a working application runtime.",
    "primaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/concord",
      "label": "Install package",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/packages/concord",
      "label": "View source",
      "variant": "secondary"
    },
    "preview": {
      "title": "Concord app runtime",
      "meta": "command → signed commit → replay",
      "statusLabel": "Deterministic",
      "statusTone": "neutral",
      "rows": [
        {
          "label": "Writes",
          "value": "stage first",
          "valueTone": "primary"
        },
        {
          "label": "Boundary",
          "value": "explicit commit",
          "valueTone": "secondary"
        },
        {
          "label": "Integrity",
          "value": "chain-linked",
          "valueTone": "accent"
        },
        {
          "label": "Result",
          "value": "derived state",
          "valueTone": "success"
        }
      ],
      "footerText": "Concord stages commands, commits them into signed parent-linked history, and rebuilds application state from deterministic replay instead of treating storage as authority."
    }
  },
  "proofModelSection": {
    "eyebrow": "The Runtime",
    "title": "A runtime built around commands and replay",
    "description": "Concord defines the runtime contract for apps built on signed commit history. You dispatch domain commands. Concord stages them through Ledger, groups them into explicit signed commits, and rebuilds plugin state from deterministic replay. The same replay stream can power local query stores. State is always derived. History is always signed.",
    "items": [
      {
        "title": "Command-first ergonomics",
        "description": "Work with domain commands like \"todo.create-item\" instead of manually constructing entries. Concord turns intent into structured ledger input."
      },
      {
        "title": "Explicit commit boundaries",
        "description": "Decide when history becomes permanent. Commits bind ordered entry IDs and parent linkage into a signed chain."
      },
      {
        "title": "Replay as the state engine",
        "description": "Plugin state is rebuilt from ordered history. No hidden mutations. No silent drift. If you can replay it, you can trust it."
      },
      {
        "title": "Integrity that actually means something",
        "description": "If a committed byte changes, verification fails. Concord tells you exactly what broke and refuses to treat corrupted history as valid runtime state."
      }
    ]
  },
  "proofJsonSection": {
    "eyebrow": "Portable Truth",
    "title": "A portable ledger artifact you can tamper and validate",
    "description": "This artifact is exported from the live Concord runtime above. Edit a signed commit, change a parent link, or tweak a payload and validation fails immediately. What you are seeing is the entire app history.",
    "code": "{\n  \"format\": \"concord-ledger\",\n  \"version\": \"1\",\n  \"commits\": {\n    \"commit_0002\": {\n      \"commitId\": \"commit_0002\",\n      \"parentCommitId\": \"commit_0001\",\n      \"committedAt\": \"2026-03-18T09:20:05.000Z\",\n      \"metadata\": {\n        \"message\": \"Seed landing demo todos\"\n      },\n      \"entryIds\": [\"entry_001\", \"entry_002\"],\n      \"seal\": {\n        \"type\": \"seal-proof\",\n        \"signature\": \"...\"\n      }\n    }\n  },\n  \"entries\": {\n    \"entry_001\": {\n      \"entryId\": \"entry_001\",\n      \"kind\": \"todo.item.created\",\n      \"authoredAt\": \"2026-03-18T09:20:02.000Z\",\n      \"author\": \"did:key:demo\",\n      \"meta\": {\n        \"pluginId\": \"todo\",\n        \"command\": \"todo.create-item\"\n      },\n      \"payload\": {\n        \"type\": \"plain\",\n        \"data\": {\n          \"id\": \"todo_001\",\n          \"title\": \"Buy milk\",\n          \"completed\": false\n        }\n      },\n      \"seal\": {\n        \"type\": \"seal-proof\",\n        \"signature\": \"...\"\n      }\n    }\n  },\n  \"head\": \"commit_0002\"\n}",
    "supportingText": "Tamper with it. Break a signature. Change a parent. Watch verification fail. Concord shows precisely where integrity was lost and refuses to pretend the remaining history is safe."
  },
  "surfacesSection": {
    "eyebrow": "Surfaces",
    "title": "One signed history. Many ways to use it.",
    "description": "Concord lives between Ledger and your application layer. It preserves signed commit integrity while making command handling, replay, and plugin-based architecture practical for real-world apps.",
    "items": [
      {
        "title": "Runtime package",
        "description": "Use @ternent/concord for command dispatch, explicit commits, replay-based state rebuilding, and projection fanout.",
        "tone": "primary",
        "icon": "terminal"
      },
      {
        "title": "Ledger integration",
        "description": "Concord builds directly on @ternent/ledger for staging, commit creation, replay, verification, export, and import. History stays consistent everywhere.",
        "tone": "secondary",
        "icon": "pin"
      },
      {
        "title": "Suite composition",
        "description": "Authenticate entries with Seal. Protect payloads with Armour. Bind everything into tamper-evident signed history.",
        "tone": "info",
        "icon": "globe"
      }
    ]
  },
  "staticBuildSection": {
    "eyebrow": "Example Use",
    "title": "Build an app without owning user data",
    "description": "Create a Concord app, load or create its ledger, dispatch commands, commit authored history, and rebuild plugin state from replay. You can optionally project the same replay stream into fast local query stores.",
    "steps": [
      {
        "title": "Create an app runtime",
        "description": "Combine identity, storage, plugins, and optional projection targets into a Concord app."
      },
      {
        "title": "Dispatch commands",
        "description": "Express user intent through domain commands. Concord turns them into staged ledger entries."
      },
      {
        "title": "Commit authored history",
        "description": "Group staged entries into a signed, parent-linked commit with meaningful metadata."
      },
      {
        "title": "Replay into state",
        "description": "Concord rebuilds plugin state deterministically from ordered commit history."
      },
      {
        "title": "Verify integrity",
        "description": "Run verification at any time. If history has been altered, Concord fails loudly and precisely."
      }
    ],
    "closingLine": "Storage is replaceable. History is signed. State is derived. Concord keeps those boundaries clean.",
    "primaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/concord",
      "label": "Install package",
      "variant": "primary"
    }
  },
  "developerSection": {
    "eyebrow": "For Developers",
    "title": "A runtime you can actually build on",
    "description": "Concord is the developer-facing runtime above Ledger. It handles command routing, commit control, replay orchestration, and projection fanout without becoming a framework or hiding your domain logic.",
    "surfaces": [
      "Command runtime",
      "Explicit commit boundaries",
      "Projection targets"
    ],
    "tabs": [
      {
        "value": "js",
        "label": "JavaScript",
        "title": "Create a Concord app",
        "meta": "JavaScript",
        "code": "import { createConcordApp } from \"@ternent/concord\"\nimport { createTodoPlugin } from \"@ternent/concord-plugin-todo\"\n\nconst app = await createConcordApp({\n  identity,\n  storage,\n  plugins: [createTodoPlugin()],\n})\n\nawait app.load()\n\nawait app.command(\"todo.create-item\", {\n  id: crypto.randomUUID(),\n  title: \"Buy milk\",\n})\n\nawait app.command(\"todo.rename-item\", {\n  id: \"todo_123\",\n  title: \"Buy oat milk\",\n})\n\nawait app.commit({\n  metadata: {\n    message: \"Create and refine first todo\",\n  },\n})\n\nconst verification = await app.verify()\nconst todoState = app.getPluginState(\"todo\")",
        "supportingCopy": "You dispatch commands. You decide when to commit. Concord rebuilds state from replay and enforces integrity across the entire history.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/concord",
          "label": "View source"
        }
      },
      {
        "value": "cli",
        "label": "Ledger + Seal",
        "title": "Build on Ledger instead of replacing it",
        "meta": "Ledger integration",
        "code": "const app = await createConcordApp({\n  identity,\n  storage,\n  plugins,\n  protocol,\n  seal,\n  armour,\n})\n\nawait app.load()\n\nawait app.command(\"journal.create-entry\", {\n  text: \"private note\"\n})\n\nawait app.commit({\n  metadata: {\n    message: \"Commit private note\"\n  }\n})\n\nconst verification = await app.verify()\nconst ledger = await app.exportLedger()",
        "supportingCopy": "Concord does not invent a new truth model. It builds on Ledger’s signed commit history and strict verification semantics.",
        "link": {
          "href": "https://ledger.ternent.dev",
          "label": "Explore Ledger"
        }
      },
      {
        "value": "action",
        "label": "Projection targets",
        "title": "Fan replay into local query stores",
        "meta": "projection target",
        "code": "const app = await createConcordApp({\n  identity,\n  storage,\n  plugins: [createTodoPlugin()],\n  projectionTargets: [loki.target],\n})\n\nawait app.load()\n\nawait app.command(\"todo.create-item\", {\n  id: \"todo_123\",\n  title: \"Buy milk\",\n})\n\nawait app.commit({\n  metadata: {\n    message: \"Commit todo projection\"\n  }\n})\n\nconst rows = loki.getCollection(\"concord/all\")?.find() ?? []",
        "supportingCopy": "Projection targets consume the same replay stream that builds plugin state. They are fast derived views, never authority.",
        "link": {
          "href": "https://seal.ternent.dev",
          "label": "Explore Seal"
        }
      }
    ]
  },
  "ctaSection": {
    "eyebrow": "Ready",
    "title": "Build on signed history without giving storage authority.",
    "description": "Use Concord for command ergonomics and replay-driven state, Ledger for signed commit history, and Seal for cryptographic proof. Keep your app portable. Keep your truth verifiable.",
    "primaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/concord",
      "label": "Install package",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/packages/concord",
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
        "href": "https://www.npmjs.com/package/@ternent/concord",
        "label": "Package"
      },
      {
        "href": "https://ledger.ternent.dev",
        "label": "Ledger"
      },
      {
        "href": "https://seal.ternent.dev",
        "label": "Seal"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/packages/concord",
        "label": "GitHub"
      }
    ]
  }
} as const satisfies LandingPageConfig;
