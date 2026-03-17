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
  "appId": "armour",
  "appTitle": "Armour - Encrypt for identities with explicit age-compatible primitives.",
  "defaultHost": "armour.ternent.dev",
  "themeName": "armour",
  "defaultThemeMode": "dark"
} as const satisfies AppConfig;

export const appSeoConfig = {
  "shortName": "Armour",
  "description": "Armour bridges @ternent/identity and @ternent/rage for explicit identity-based and passphrase encryption with age-compatible output.",
  "themeColor": "#14b8a6",
  "backgroundColor": "#071513",
  "lang": "en"
} as const satisfies AppSeoConfig;

export const appThemeName = "armour";

export const appThemePrefix = appThemeName;

export const landingPageConfig = {
  "navigationLinks": [
    {
      "href": "#proof-model",
      "label": "Why Armour"
    },
    {
      "href": "#proof-json",
      "label": "Encryption Model"
    },
    {
      "href": "#surfaces",
      "label": "Surfaces"
    },
    {
      "href": "#static-build",
      "label": "How it works"
    },
    {
      "href": "#developers",
      "label": "Developers"
    }
  ],
  "hero": {
    "eyebrow": "armour",
    "title": "Encrypt for identities with explicit age-compatible primitives.",
    "description": "Armour is the bridge between @ternent/identity and @ternent/rage. It derives age-compatible recipients from shared identities, keeps recipient and passphrase modes explicit, and gives browser and package surfaces the same clean encryption contract.",
    "supportingLine": "Identity stays the capability root. Rage stays the crypto engine. Armour keeps encryption explicit and portable.",
    "note": "Encryption is not signing. Authenticity belongs to Seal.",
    "primaryAction": {
      "href": "#developers",
      "label": "See the API",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/packages/armour",
      "label": "View package source",
      "variant": "secondary"
    },
    "preview": {
      "title": "identity → recipient → ciphertext",
      "meta": "explicit model",
      "statusLabel": "Stable",
      "statusTone": "neutral",
      "rows": [
        {
          "label": "Identity",
          "value": "Shared capability root",
          "valueTone": "primary"
        },
        {
          "label": "Modes",
          "value": "Recipients or passphrase",
          "valueTone": "secondary"
        },
        {
          "label": "Output",
          "value": "Age-compatible ciphertext",
          "valueTone": "accent"
        },
        {
          "label": "Boundary",
          "value": "No artifact format here",
          "valueTone": "success"
        }
      ],
      "footerText": "Armour encrypts and decrypts. Portable sealed artifacts belong to Seal."
    }
  },
  "proofModelSection": {
    "eyebrow": "Why Armour",
    "title": "The bridge layer",
    "description": "Armour is an opinionated protocol library for identity-backed encryption. It derives age-compatible recipients and secret keys through @ternent/identity, delegates encryption and decryption to @ternent/rage, and keeps the public contract explicit across browser and package surfaces.",
    "items": [
      {
        "title": "Identity-backed",
        "description": "Start from one serialized identity model and derive the age-compatible capability you need without splitting the concept in two."
      },
      {
        "title": "Explicit modes",
        "description": "Recipient mode and passphrase mode stay separate on purpose. Armour does not guess which contract you meant."
      },
      {
        "title": "Age-compatible output",
        "description": "Ciphertext comes from rage and stays aligned with age expectations and tooling instead of inventing a new format."
      },
      {
        "title": "Async-first",
        "description": "Public APIs stay Promise-based and initialization remains explicit through initArmour()."
      }
    ]
  },
  "proofJsonSection": {
    "eyebrow": "Encryption Model",
    "title": "Raw ciphertext, clear boundaries",
    "description": "Armour does not define an envelope or portable artifact format. It focuses on explicit encryption and decryption, leaving sealed transport objects and proof-bearing formats to Seal.",
    "code": "import {\n  initArmour,\n  encryptForIdentities,\n  decryptWithIdentity\n} from \"@ternent/armour\"\n\nawait initArmour()\n\nconst ciphertext = await encryptForIdentities({\n  identities: [identity],\n  data: new TextEncoder().encode(\"portable payload\"),\n  output: \"armor\"\n})\n\nconst plaintext = await decryptWithIdentity({\n  identity,\n  data: ciphertext\n})",
    "supportingText": "Armour owns the bridge from identity to age-compatible encryption. Sealed artifacts belong elsewhere in the stack."
  },
  "surfacesSection": {
    "eyebrow": "Surfaces",
    "title": "One encryption model. Multiple surfaces.",
    "description": "Armour keeps the same bridge contract across the JavaScript package and the browser app, so the mental model does not change when the surface does.",
    "items": [
      {
        "title": "JavaScript package",
        "description": "Use @ternent/armour directly when you want identity-based encryption, passphrase mode, and explicit control in your own runtime.",
        "tone": "primary",
        "icon": "terminal"
      },
      {
        "title": "Browser app",
        "description": "The browser surface uses the same language and the same model. It is not a separate encryption product with different rules.",
        "tone": "secondary",
        "icon": "globe"
      },
      {
        "title": "Concord ecosystem",
        "description": "Armour is the ergonomic bridge for Ternent surfaces that already use @ternent/identity and need age-compatible encryption without muddying boundaries.",
        "tone": "info",
        "icon": "stack"
      }
    ]
  },
  "staticBuildSection": {
    "eyebrow": "How it works",
    "title": "Encrypt for identities without changing the primitive",
    "description": "Create or import an identity, encrypt to one or more identities, and move raw ciphertext between environments without changing the underlying contract.",
    "steps": [
      {
        "title": "Start from an identity",
        "description": "Use a serialized @ternent/identity payload as the capability root for recipient derivation and decryption."
      },
      {
        "title": "Choose an explicit mode",
        "description": "Encrypt for identities when you have recipients, or use passphrase mode when that is the right contract for the job."
      },
      {
        "title": "Keep the ciphertext raw",
        "description": "Armour returns age-compatible ciphertext directly and does not wrap it in a package-specific transport format."
      },
      {
        "title": "Decrypt with the matching capability",
        "description": "Decrypt with the derived age secret key from the identity, or with the passphrase when passphrase mode was used."
      }
    ],
    "closingLine": "Armour keeps the bridge stable while identity and rage keep their own responsibilities.",
    "primaryAction": {
      "href": "#developers",
      "label": "Explore examples",
      "variant": "primary"
    }
  },
  "developerSection": {
    "eyebrow": "For Developers",
    "title": "A clean layer above rage",
    "description": "@ternent/armour is the opinionated library layer above @ternent/rage. It adds identity integration and browser-safe helpers without changing the underlying crypto responsibilities or introducing artifact semantics.",
    "surfaces": [
      "@ternent/armour",
      "@ternent/identity",
      "@ternent/rage"
    ],
    "tabs": [
      {
        "value": "js",
        "label": "JavaScript",
        "title": "Encrypt directly for identities",
        "meta": "JavaScript",
        "code": "import { createIdentity } from \"@ternent/identity\"\nimport {\n  initArmour,\n  encryptTextForIdentities,\n  decryptTextWithIdentity\n} from \"@ternent/armour\"\n\nawait initArmour()\n\nconst identity = await createIdentity()\nconst ciphertext = await encryptTextForIdentities({\n  identities: [identity],\n  text: \"hello world\"\n})\n\nconst plaintext = await decryptTextWithIdentity({\n  identity,\n  data: ciphertext\n})",
        "supportingCopy": "Identity-based APIs are the first-class surface. Recipient derivation comes from @ternent/identity and encryption comes from @ternent/rage.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/armour",
          "label": "View package source"
        }
      },
      {
        "value": "envelope",
        "label": "Raw Bytes",
        "title": "Work directly with bytes and explicit output modes",
        "meta": "armor | binary",
        "code": "import {\n  initArmour,\n  encryptForIdentities,\n  decryptWithIdentity\n} from \"@ternent/armour\"\n\nawait initArmour()\n\nconst ciphertext = await encryptForIdentities({\n  identities: [identity],\n  data: new TextEncoder().encode(\"portable payload\"),\n  output: \"binary\"\n})\n\nconst plaintext = await decryptWithIdentity({\n  identity,\n  data: ciphertext\n})",
        "supportingCopy": "Armour exposes raw encryption APIs for byte payloads and explicit output modes. It does not define an envelope or transport container.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/armour",
          "label": "Read package spec"
        }
      },
      {
        "value": "passphrase",
        "label": "Passphrase",
        "title": "Keep passphrase mode explicit",
        "meta": "passphrase",
        "code": "import {\n  initArmour,\n  encryptTextWithPassphrase,\n  decryptTextWithPassphrase\n} from \"@ternent/armour\"\n\nawait initArmour()\n\nconst ciphertext = await encryptTextWithPassphrase({\n  passphrase: \"correct horse battery staple\",\n  text: \"secret\"\n})\n\nconst plaintext = await decryptTextWithPassphrase({\n  passphrase: \"correct horse battery staple\",\n  data: ciphertext\n})",
        "supportingCopy": "Passphrase mode is separate from recipient mode. Armour does not overload one function to infer both.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/armour/README.md",
          "label": "Open README"
        }
      }
    ]
  },
  "ctaSection": {
    "eyebrow": "Ready",
    "title": "Use one identity model. Keep encryption explicit.",
    "description": "Start from the shared identity model, use the package directly, and keep encryption, signing, and artifact responsibilities separate across every surface.",
    "primaryAction": {
      "href": "#developers",
      "label": "Start with the package",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/samternent/home/tree/main/packages/armour",
      "label": "View package source",
      "variant": "secondary"
    }
  },
  "footer": {
    "brandLabel": "ternent.dev",
    "brandHref": "https://ternent.dev",
    "copyright": "© 2026.",
    "links": [
      {
        "href": "#developers",
        "label": "API examples"
      },
      {
        "href": "#proof-json",
        "label": "Encryption model"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/packages/armour",
        "label": "JavaScript package"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/apps/armour",
        "label": "GitHub"
      }
    ]
  }
} as const satisfies LandingPageConfig;
