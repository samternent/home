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
  "appId": "ledger",
  "appTitle": "Ledger - An append-only state engine for portable application truth.",
  "defaultHost": "ledger.ternent.dev",
  "themeName": "ledger",
  "defaultThemeMode": "dark"
} as const satisfies AppConfig;

export const appSeoConfig = {
  "shortName": "Ledger",
  "description": "Ledger is an append-only state engine for portable application truth, deterministic replay, and non-custodial software.",
  "themeColor": "#c46a6a",
  "backgroundColor": "#140d0d",
  "lang": "en"
} as const satisfies AppSeoConfig;

export const appThemeName = "ledger";

export const appThemePrefix = appThemeName;

export const landingPageConfig = {
  "navigationLinks": [
    {
      "href": "#proof-model",
      "label": "The Primitive"
    },
    {
      "href": "#proof-json",
      "label": "Ledger Format"
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
    "eyebrow": "ledger",
    "title": "An append-only state engine for portable application truth.",
    "description": "Ledger defines a minimal contract for authored entries, staged truth, committed history, deterministic replay, and derived projection. It composes Seal for authenticity and Armour for protected payloads without turning storage into authority.",
    "supportingLine": "Ledger stores truth, replays state, and keeps projection derived. It does not require a central database to be trusted.",
    "note": "Ledger is not the app. It is the state engine the app projects from.",
    "primaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/ledger",
      "label": "Install package",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/packages/ledger-v2",
      "label": "View source",
      "variant": "secondary"
    },
    "preview": {
      "title": "Ledger artifact",
      "meta": "concord-ledger",
      "statusLabel": "Append-only",
      "statusTone": "neutral",
      "rows": [
        {
          "label": "Truth",
          "value": "committed entries",
          "valueTone": "primary"
        },
        {
          "label": "Type",
          "value": "concord-ledger",
          "valueTone": "secondary"
        },
        {
          "label": "Replay",
          "value": "deterministic",
          "valueTone": "accent"
        },
        {
          "label": "Result",
          "value": "derived projection",
          "valueTone": "success"
        }
      ],
      "footerText": "Ledger keeps committed truth portable and replayable without treating projection as source-of-truth."
    }
  },
  "proofModelSection": {
    "eyebrow": "The Primitive",
    "title": "The primitive",
    "description": "Ledger defines a minimal state-engine contract. It authors entries, stages them, commits them into append-only history, and replays that history into projection. It does not define app commands, hosting, or storage ownership. It emits truth and derives state.",
    "items": [
      {
        "title": "Append-only truth",
        "description": "Committed history is immutable. New facts are appended, never rewritten."
      },
      {
        "title": "Deterministic replay",
        "description": "The same committed truth replays into the same projection under the same rules."
      },
      {
        "title": "Explicit composition",
        "description": "Seal authenticates entries. Armour protects payloads. Ledger composes both without blurring them."
      },
      {
        "title": "Storage-agnostic",
        "description": "Storage persists committed and staged truth. It does not become the source of authority."
      }
    ]
  },
  "proofJsonSection": {
    "eyebrow": "The Ledger Format",
    "title": "The ledger format",
    "description": "A ledger container is plain JSON. It holds committed truth only. Staged truth lives separately in runtime state and persistence snapshots.",
    "code": "{\n  \"format\": \"concord-ledger\",\n  \"version\": \"1\",\n  \"metadata\": {\n    \"createdAt\": \"2026-03-18T00:00:00.000Z\"\n  },\n  \"commits\": {\n    \"commit_001\": {\n      \"parent\": null,\n      \"timestamp\": \"2026-03-18T00:00:00.000Z\",\n      \"entries\": [\"entry_001\"],\n      \"metadata\": null\n    }\n  },\n  \"entries\": {\n    \"entry_001\": {\n      \"entryId\": \"entry_001\",\n      \"kind\": \"todo.item.created\",\n      \"authoredAt\": \"2026-03-18T00:00:00.000Z\",\n      \"author\": \"sam\",\n      \"meta\": null,\n      \"payload\": {\n        \"type\": \"plain\",\n        \"data\": {\n          \"id\": \"todo_123\",\n          \"title\": \"Buy milk\"\n        }\n      },\n      \"seal\": {\n        \"type\": \"seal-proof\",\n        \"version\": \"2\",\n        \"algorithm\": \"Ed25519\"\n      }\n    }\n  },\n  \"head\": \"commit_001\"\n}",
    "supportingText": "The container stores committed truth only. Projection is always recomputed from replay."
  },
  "surfacesSection": {
    "eyebrow": "Surfaces",
    "title": "One truth model. Multiple layers.",
    "description": "Ledger sits between deep protocol rules and higher-level Concord runtime ergonomics. It keeps the state engine explicit across every surface that builds on it.",
    "items": [
      {
        "title": "State engine package",
        "description": "Use @ternent/ledger directly when you need append, commit, replay, verify, export, and import over portable truth.",
        "tone": "primary",
        "icon": "terminal"
      },
      {
        "title": "Concord runtime layer",
        "description": "Concord builds app-facing command and plugin ergonomics above the same ledger truth model. It should not reimplement ledger mechanics.",
        "tone": "secondary",
        "icon": "pin"
      },
      {
        "title": "Portable storage adapters",
        "description": "Ledger stays storage-agnostic so committed truth can live in local files, Solid, Drive, or other persistence layers.",
        "tone": "info",
        "icon": "globe"
      }
    ]
  },
  "staticBuildSection": {
    "eyebrow": "Example Use",
    "title": "Append truth. Replay state.",
    "description": "Build an entry, optionally protect its payload, seal it, commit it, and replay the ledger into derived state. The history stays portable. The projection can always be rebuilt.",
    "steps": [
      {
        "title": "Author an entry",
        "description": "Create a ledger-owned truth record for an application fact, such as a todo item being created."
      },
      {
        "title": "Protect and seal it",
        "description": "Encrypt the payload when needed, then seal the resulting entry so authenticity binds to stored truth."
      },
      {
        "title": "Commit it",
        "description": "Move staged entries into committed append-only history in deterministic order."
      },
      {
        "title": "Replay it",
        "description": "Recompute projection from committed truth, with optional decryption when capability is present."
      }
    ],
    "closingLine": "Truth is committed once. Projection is rebuilt whenever needed.",
    "primaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/ledger",
      "label": "Install package",
      "variant": "primary"
    }
  },
  "developerSection": {
    "eyebrow": "For Developers",
    "title": "For developers",
    "description": "The Ledger package is the state engine layer between protocol primitives and Concord runtime ergonomics. It owns authored truth records, replay, verification, and persistence boundaries without becoming an app framework.",
    "surfaces": [
      "State engine",
      "Replay pipeline",
      "Persistence boundary"
    ],
    "tabs": [
      {
        "value": "js",
        "label": "JavaScript",
        "title": "Append and replay directly",
        "meta": "JavaScript",
        "code": "import { createLedger } from \"@ternent/ledger\"\n\nconst ledger = await createLedger({\n  identity,\n  protocol,\n  seal,\n  armour,\n  storage,\n  projector,\n})\n\nawait ledger.create()\n\nawait ledger.append({\n  kind: \"todo.item.created\",\n  payload: {\n    id: \"todo_123\",\n    title: \"Buy milk\"\n  }\n})\n\nawait ledger.commit({\n  metadata: { reason: \"user-action\" }\n})\n\nconst projection = await ledger.replay()",
        "supportingCopy": "Use the package directly when you want explicit control over append, commit, replay, and verification without jumping straight to app-level runtime abstractions.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/ledger-v2",
          "label": "View source"
        }
      },
      {
        "value": "cli",
        "label": "Encrypted entries",
        "title": "Protect payloads before they become truth",
        "meta": "Armour + Seal",
        "code": "const entry = await ledger.append({\n  kind: \"journal.entry.created\",\n  payload: {\n    text: \"private note\"\n  },\n  protection: {\n    type: \"recipients\",\n    recipients: [\"age1...\"],\n    encoding: \"armor\"\n  }\n})\n\nawait ledger.commit()\nconst projection = await ledger.replay()",
        "supportingCopy": "Payload protection is explicit. Armour encrypts first, then Ledger seals the resulting entry so the proof binds to encrypted state rather than plaintext.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/ledger-v2/SPEC.md",
          "label": "Read SPEC"
        }
      },
      {
        "value": "action",
        "label": "Verification",
        "title": "Verify truth without trusting projection",
        "meta": "verify()",
        "code": "const result = await ledger.verify()\n\nconsole.log(result.valid)\nconsole.log(result.commitChainValid)\nconsole.log(result.entriesValid)\nconsole.log(result.payloadHashesValid)\nconsole.log(result.invalidCommitIds)\nconsole.log(result.invalidEntryIds)",
        "supportingCopy": "Verification checks committed structure, commit chain, entry proofs, and encrypted payload hashes. Projection is derived later and never treated as the source of truth.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/ledger-v2",
          "label": "Open package on GitHub"
        }
      }
    ]
  },
  "ctaSection": {
    "eyebrow": "Ready",
    "title": "Start with truth. Build projection on top.",
    "description": "Append facts, commit them deterministically, replay projection anywhere, and keep storage from becoming authority.",
    "primaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/ledger",
      "label": "Install package",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/packages/ledger-v2",
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
        "href": "https://www.npmjs.com/package/@ternent/ledger",
        "label": "Package"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/packages/ledger-v2/SPEC.md",
        "label": "SPEC"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/packages/ledger-v2",
        "label": "Source"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/apps/ledger",
        "label": "GitHub"
      }
    ]
  }
} as const satisfies LandingPageConfig;
