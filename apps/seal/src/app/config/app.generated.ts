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
  "appId": "seal",
  "appTitle": "Seal - A portable proof primitive for signed artifacts.",
  "defaultHost": "seal.ternent.dev",
  "themeName": "proof",
  "defaultThemeMode": "dark"
} as const satisfies AppConfig;

export const appSeoConfig = {
  "shortName": "Seal",
  "description": "Seal is a portable proof primitive for signed artifacts and versioned JSON proofs.",
  "themeColor": "#2f81f7",
  "backgroundColor": "#060a0f",
  "lang": "en"
} as const satisfies AppSeoConfig;

export const appThemeName = "proof";

export const appThemePrefix = appThemeName;

export const landingPageConfig = {
  "navigationLinks": [
    {
      "href": "#proof-model",
      "label": "The Primitive"
    },
    {
      "href": "#proof-json",
      "label": "Proof Format"
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
    "eyebrow": "seal",
    "title": "A portable proof primitive for signed artifacts.",
    "description": "Seal defines a minimal contract for producing versioned JSON proofs for files and build outputs. The proof is self-contained, portable, and verifiable without a backend.",
    "supportingLine": "Seal emits a self-contained proof file. It does not require a backend service to verify.",
    "note": "The primitive is the product. The artifact is the output.",
    "primaryAction": {
      "href": "https://github.com/marketplace/actions/seal-action",
      "label": "Sign in GitHub Actions",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/seal-cli",
      "label": "Install CLI/API",
      "variant": "secondary"
    },
    "preview": {
      "title": "Proof artifact",
      "meta": "proof.json",
      "statusLabel": "Portable",
      "statusTone": "neutral",
      "rows": [
        {
          "label": "Subject",
          "value": "artifact.tar.gz",
          "valueTone": "primary"
        },
        {
          "label": "Type",
          "value": "seal-proof",
          "valueTone": "secondary"
        },
        {
          "label": "Algorithm",
          "value": "Ed25519",
          "valueTone": "accent"
        },
        {
          "label": "Result",
          "value": "Verifiable artifact",
          "valueTone": "success"
        }
      ],
      "footerText": "Seal emits a self-contained proof file that can move between environments unchanged."
    }
  },
  "proofModelSection": {
    "eyebrow": "The Primitive",
    "title": "The primitive",
    "description": "Seal defines a minimal proof contract. It hashes a subject deterministically, signs that hash locally, and emits a versioned JSON proof artifact. It does not define storage, hosting, or identity lifecycle. It emits a file.",
    "items": [
      {
        "title": "Deterministic hashing",
        "description": "The same manifest produces the same subject hash."
      },
      {
        "title": "Local signing",
        "description": "Signing happens where your signer already exists."
      },
      {
        "title": "Portable artifact",
        "description": "The output is a proof file that can move between environments unchanged."
      },
      {
        "title": "Versioned format",
        "description": "The proof format is explicit and stable across implementations."
      }
    ]
  },
  "proofJsonSection": {
    "eyebrow": "The Proof Format",
    "title": "The proof format",
    "description": "A proof is plain JSON. It can be stored, published, inspected, and verified without a backend.",
    "code": "{\n  \"version\": \"2\",\n  \"type\": \"seal-proof\",\n  \"algorithm\": \"Ed25519\",\n  \"createdAt\": \"2026-03-13T00:00:00.000Z\",\n  \"subject\": {\n    \"kind\": \"artifact\",\n    \"path\": \"artifact.tar.gz\",\n    \"hash\": \"sha256:...\"\n  },\n  \"signer\": {\n    \"publicKey\": \"BASE64URL-RAW-ED25519-PUBLIC-KEY\",\n    \"keyId\": \"...\"\n  },\n  \"signature\": \"...\"\n}",
    "supportingText": "The proof is self-describing and versioned."
  },
  "surfacesSection": {
    "eyebrow": "Surfaces",
    "title": "One proof model. Multiple surfaces.",
    "description": "Seal uses one proof contract across every implementation surface.",
    "items": [
      {
        "title": "GitHub Action",
        "description": "Sign artifacts in CI and publish a proof as part of the workflow output.",
        "tone": "primary",
        "icon": "terminal"
      },
      {
        "title": "CLI",
        "description": "Generate proofs and verify them locally from the terminal.",
        "tone": "secondary",
        "icon": "pin"
      },
      {
        "title": "JavaScript library",
        "description": "Integrate the primitive directly in your own runtime. The CLI and Action are built on the same library.",
        "tone": "info",
        "icon": "globe"
      }
    ]
  },
  "staticBuildSection": {
    "eyebrow": "Example Use",
    "title": "Publish an artifact with its proof",
    "description": "Build an artifact. Hash it deterministically. Sign the hash locally. Publish the proof alongside the artifact.",
    "steps": [
      {
        "title": "Build an artifact",
        "description": "Produce a release file, dataset, document, build output, or generated archive."
      },
      {
        "title": "Hash it deterministically",
        "description": "Compute the subject hash from the artifact bytes."
      },
      {
        "title": "Sign it",
        "description": "Sign the hash locally and emit a proof file."
      },
      {
        "title": "Publish the proof alongside it",
        "description": "Ship the artifact and proof together so the proof can be verified later."
      }
    ],
    "closingLine": "The artifact stays the same. The proof travels with it.",
    "primaryAction": {
      "href": "https://github.com/marketplace/actions/seal-action",
      "label": "Sign in GitHub Actions",
      "variant": "primary"
    }
  },
  "developerSection": {
    "eyebrow": "For Developers",
    "title": "For developers",
    "description": "The JavaScript library is the reference implementation of the primitive. The CLI and GitHub Action are thin surfaces on top of the same contract.",
    "surfaces": [
      "JavaScript library",
      "GitHub Action",
      "CLI"
    ],
    "tabs": [
      {
        "value": "js",
        "label": "JavaScript",
        "title": "Use the JavaScript API directly",
        "meta": "JavaScript",
        "code": "import {\n  createSealProof,\n  verifySealProofAgainstBytes\n} from \"@ternent/seal-cli/proof\"\n\nconst proof = await createSealProof({\n  signer: { identity },\n  subject: {\n    kind: \"artifact\",\n    path: \"artifact.tar.gz\",\n    hash: \"sha256:...\"\n  }\n})\n\nconst verified = await verifySealProofAgainstBytes(proof, artifactBytes)",
        "supportingCopy": "Integrate the library directly when you need control over signing or verification flows. Keep the proof format unchanged across environments.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/seal-cli",
          "label": "View JavaScript API"
        }
      },
      {
        "value": "cli",
        "label": "seal-cli",
        "title": "Generate and verify proofs from the CLI",
        "meta": "seal-cli",
        "code": "pnpm add -D @ternent/seal-cli\n\nseal identity create --out identity.json --words 24 --mnemonic-out seal-seed-phrase.txt\nexport SEAL_IDENTITY_FILE=\"./identity.json\"\n\nseal sign --input artifact.tar.gz --out proof.json\nseal verify --proof proof.json --input artifact.tar.gz --json",
        "supportingCopy": "The CLI is a thin local surface over the same proof contract, including mnemonic-backed identity creation.",
        "link": {
          "href": "https://www.npmjs.com/package/@ternent/seal-cli",
          "label": "See @ternent/seal-cli on npm"
        }
      },
      {
        "value": "action",
        "label": "GitHub Action",
        "title": "Sign artifacts in CI",
        "meta": "GitHub Action",
        "code": "- uses: actions/checkout@v4\n- uses: actions/setup-node@v4\n  with:\n    node-version-file: \".nvmrc\"\n- uses: samternent/seal-action@v2\n  env:\n    SEAL_IDENTITY: ${{ secrets.SEAL_IDENTITY }}\n  with:\n    assets-directory: dist\n    package-name: @ternent/seal-cli\n    package-version: latest",
        "supportingCopy": "The Action is a CI surface built on the same JavaScript library. Do not fork the proof contract.",
        "link": {
          "href": "https://github.com/marketplace/actions/seal-action",
          "label": "Open Seal Action on GitHub Marketplace"
        }
      }
    ]
  },
  "ctaSection": {
    "eyebrow": "Ready",
    "title": "Start in CI. Keep the same proof everywhere.",
    "description": "Sign in CI, verify locally, integrate directly via the JavaScript library.",
    "primaryAction": {
      "href": "https://github.com/marketplace/actions/seal-action",
      "label": "Sign in GitHub Actions",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/seal-cli",
      "label": "Install CLI/API",
      "variant": "secondary"
    }
  },
  "footer": {
    "brandLabel": "ternent.dev",
    "brandHref": "https://ternent.dev",
    "copyright": "© 2026.",
    "links": [
      {
        "href": "https://github.com/marketplace/actions/seal-action",
        "label": "GitHub Action"
      },
      {
        "href": "https://www.npmjs.com/package/@ternent/seal-cli",
        "label": "CLI"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/packages/seal-cli",
        "label": "JavaScript API"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/apps/seal",
        "label": "GitHub"
      }
    ]
  }
} as const satisfies LandingPageConfig;
