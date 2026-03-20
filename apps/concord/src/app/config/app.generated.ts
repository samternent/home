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
  "appTitle": "Concord - Build apps from replayable, signed history.",
  "defaultHost": "concord.ternent.dev",
  "themeName": "concord",
  "defaultThemeMode": "dark"
} as const satisfies AppConfig;

export const appSeoConfig = {
  "shortName": "Concord",
  "description": "Concord is a runtime for building applications from replayable, signed, optionally encrypted history.",
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
    "title": "Build apps from replayable, signed history.",
    "description": "Concord is a runtime for building applications where state is derived from signed, append-only history. Dispatch commands. Commit intentionally. Encrypt sensitive payloads client-side. Replay history into state. The result is a portable, verifiable document instead of a mutable app database.",
    "supportingLine": "Write intent. Commit it. Replay into state.",
    "note": "Small, replayable documents you can verify, move, and rebuild anywhere.",
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
      "title": "Concord runtime",
      "meta": "command → signed history → replay",
      "statusLabel": "Deterministic",
      "statusTone": "neutral",
      "rows": [
        {
          "label": "Writes",
          "value": "staged first",
          "valueTone": "primary"
        },
        {
          "label": "Commit",
          "value": "signed + linked",
          "valueTone": "secondary"
        },
        {
          "label": "Payloads",
          "value": "optional encryption",
          "valueTone": "accent"
        },
        {
          "label": "Result",
          "value": "derived state",
          "valueTone": "success"
        }
      ],
      "footerText": "Concord stages commands, commits them into signed parent-linked history, supports encrypted payloads when needed, and rebuilds application state from replay instead of treating storage as authority."
    }
  },
  "proofModelSection": {
    "eyebrow": "Runtime Model",
    "title": "History is the source of truth. State is a projection.",
    "description": "Commands produce entries. Commits make them durable. Replay rebuilds application state from ordered history. If committed history changes, verification fails. If history can be replayed and verified, it can be trusted.",
    "items": [
      {
        "title": "Command-first ergonomics",
        "description": "Work with domain commands like \"todo.create-item\" instead of hand-authoring low-level entries."
      },
      {
        "title": "Explicit commit boundaries",
        "description": "Decide when staged work becomes durable. Commits bind ordered entries into a signed chain."
      },
      {
        "title": "Optional encrypted payloads",
        "description": "Encrypt sensitive data before it enters history. Encryption stays explicit and portable."
      },
      {
        "title": "Deterministic replay",
        "description": "Rebuild state from ordered history through replay plugins. No hidden mutation. No silent drift."
      }
    ]
  },
  "proofJsonSection": {
    "eyebrow": "Portable History",
    "title": "A signed artifact you can inspect and validate",
    "description": "This artifact is exported from the live Concord runtime above. Change a commit. Break a parent link. Edit a payload. Verification fails immediately. This is the full portable application history.",
    "code": "{\n  \"format\": \"concord-ledger\",\n  \"version\": \"1\",\n  ...\n}",
    "supportingText": "Concord artifacts behave more like portable documents than traditional databases. Concord will not derive runtime state from corrupted or unverified history."
  },
  "staticBuildSection": {
    "eyebrow": "Example",
    "title": "Build without giving storage authority",
    "description": "Create a Concord app, load or create its history, dispatch commands, commit authored changes, optionally encrypt payloads, and replay entries into isolated plugins. Query derived state, not raw history. Keep history for audit, verification, and rebuild.",
    "steps": [
      {
        "title": "Create an app runtime",
        "description": "Combine identity, storage, and replay plugins into a Concord app."
      },
      {
        "title": "Dispatch commands",
        "description": "Express intent through domain commands. Concord stages structured entries."
      },
      {
        "title": "Commit authored history",
        "description": "Group staged entries into a signed, parent-linked commit with meaningful metadata."
      },
      {
        "title": "Replay into state",
        "description": "Replay plugins rebuild deterministic state or local projections."
      },
      {
        "title": "Verify integrity",
        "description": "If committed history is altered, verification fails clearly and precisely."
      }
    ],
    "closingLine": "History is signed. Payloads can be encrypted. State is derived. Storage is replaceable.",
    "primaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/concord",
      "label": "Install package",
      "variant": "primary"
    }
  },
  "developerSection": {
    "eyebrow": "Developers",
    "title": "A small runtime for replayable, verifiable applications",
    "description": "Concord handles command routing, commit control, encryption boundaries, replay orchestration, and integrity enforcement without turning into a framework. History is durable truth. Projections are the query surface.",
    "surfaces": [
      "Command runtime",
      "Explicit commit boundaries",
      "Replay plugins"
    ],
    "tabs": [
      {
        "value": "js",
        "label": "JavaScript",
        "title": "Create a Concord app",
        "meta": "JavaScript",
        "code": "import { createConcordApp } from \"@ternent/concord\"\nimport { createTodoPlugin } from \"@ternent/concord-plugin-todo\"\n\nconst app = await createConcordApp({\n  identity,\n  storage,\n  plugins: [createTodoPlugin()],\n})\n\nawait app.load()\n\nawait app.command(\"todo.create-item\", {\n  id: crypto.randomUUID(),\n  title: \"Buy milk\",\n})\n\nawait app.commit({\n  metadata: {\n    message: \"Create first todo\",\n  },\n})\n\nconst verification = await app.verify()\nconst todoState = app.getReplayState(\"todo\")",
        "supportingCopy": "Dispatch commands. Commit intentionally. Replay signed history into state.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/concord",
          "label": "View source"
        }
      }
    ]
  },
  "suiteSection": {
    "eyebrow": "The Suite",
    "title": "Concord is part of a focused stack.",
    "description": "Concord is the runtime layer in a composable suite. Beneath it are tools for append-only history, portable proof, and encryption. Most applications only need Concord. The rest is there when you do.",
    "supportingText": "Build at the runtime layer. Drop down when you need deeper control.",
    "items": [
      {
        "title": "Seal",
        "description": "Produce portable cryptographic proofs for entries, commits, and exported artifacts.",
        "themeColor": "#2f81f7",
        "link": {
          "href": "https://seal.ternent.dev",
          "label": "Explore Seal"
        }
      },
      {
        "title": "Armour",
        "description": "Encrypt payloads with explicit identity or passphrase contracts before they enter history.",
        "themeColor": "#14b8a6",
        "link": {
          "href": "https://armour.ternent.dev",
          "label": "Explore Armour"
        }
      },
      {
        "title": "Ledger",
        "description": "Stage, commit, replay, export, and verify append-only signed history.",
        "themeColor": "#c46a6a",
        "link": {
          "href": "https://ledger.ternent.dev",
          "label": "Explore Ledger"
        }
      }
    ]
  },
  "ctaSection": {
    "eyebrow": "Ready",
    "title": "Build apps from replayable, signed history.",
    "description": "Use Concord for command ergonomics, replay-driven state, and optional client-side encryption for sensitive data.",
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
