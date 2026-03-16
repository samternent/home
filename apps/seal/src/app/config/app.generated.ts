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
  "appTitle": "Seal",
  "defaultHost": "seal.ternent.dev",
  "themeName": "proof",
  "defaultThemeMode": "dark"
} as const satisfies AppConfig;

export const appSeoConfig = {
  "shortName": "Seal",
  "description": "Seal by ternent.dev for local proof signing and verification.",
  "themeColor": "#2f81f7",
  "backgroundColor": "#060a0f",
  "lang": "en"
} as const satisfies AppSeoConfig;

export const appThemeName = "proof";

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
    "title": "Sign files and static site builds. Verify them anywhere.",
    "description": "Create portable signed proof files for text, files, and static site builds. Runs in the browser, CLI, and GitHub Actions. No backend required.",
    "primaryAction": {
      "href": "/app",
      "label": "Open Web App",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://github.com/marketplace/actions/seal-action",
      "label": "View GitHub Action",
      "variant": "secondary"
    },
    "preview": {
      "title": "Published proof artifact",
      "meta": "proof.json",
      "statusLabel": "Browser-native",
      "statusTone": "info",
      "rows": [
        {
          "label": "Subject",
          "value": "dist-manifest.json",
          "valueTone": "primary"
        },
        {
          "label": "Signer",
          "value": "key:seal-demo",
          "valueTone": "secondary"
        },
        {
          "label": "Algorithm",
          "value": "ed25519",
          "valueTone": "accent"
        },
        {
          "label": "Result",
          "value": "Verification-ready",
          "valueTone": "success"
        }
      ],
      "footerText": "Seal publishes portable JSON proof files so anyone can verify integrity and signer identity without a backend dependency."
    }
  },
  "featureSection": {
    "eyebrow": "Features",
    "title": "Portable signed proof artifacts",
    "description": "Generate deterministic file manifests, sign them locally, and publish a JSON proof artifact anyone can verify.",
    "items": [
      {
        "title": "Browser-native",
        "description": "Create and verify proofs locally in your browser.",
        "tone": "info",
        "icon": "globe"
      },
      {
        "title": "Deterministic manifests",
        "description": "Generate consistent file manifests for static builds.",
        "tone": "primary",
        "icon": "pin"
      },
      {
        "title": "CI-ready",
        "description": "Sign build outputs in GitHub Actions.",
        "tone": "accent",
        "icon": "shield"
      },
      {
        "title": "No backend required",
        "description": "Signing and verification work without a server.",
        "tone": "success",
        "icon": "check"
      }
    ]
  },
  "howItWorksSection": {
    "eyebrow": "How it works",
    "title": "How it works",
    "preview": {
      "title": "Verification record",
      "meta": "proof.json",
      "rows": [
        {
          "label": "Manifest",
          "value": "sha256 subject list",
          "valueTone": "primary"
        },
        {
          "label": "Signature",
          "value": "Detached and portable",
          "valueTone": "accent"
        },
        {
          "label": "Output",
          "value": "Browser-verifiable JSON",
          "valueTone": "success"
        }
      ],
      "footerText": "Publish the manifest, signature, and optional public key so the same proof can be checked anywhere."
    },
    "steps": [
      {
        "title": "Generate a manifest",
        "description": "Create a deterministic list of files and hashes."
      },
      {
        "title": "Sign the manifest",
        "description": "Sign it with your local private key."
      },
      {
        "title": "Publish and verify",
        "description": "Share the proof file. Anyone can verify integrity and signer identity."
      }
    ]
  },
  "useCasesSection": {
    "eyebrow": "Use cases",
    "title": "Common use cases",
    "items": [
      {
        "title": "Static websites",
        "description": "Sign your build output and publish proof.json alongside your site.",
        "tone": "primary",
        "icon": "globe"
      },
      {
        "title": "Release artifacts",
        "description": "Sign downloadable assets for integrity verification.",
        "tone": "secondary",
        "icon": "shield"
      },
      {
        "title": "Documents",
        "description": "Sign PDFs or text files and share portable proof files.",
        "tone": "accent",
        "icon": "document"
      },
      {
        "title": "Research datasets",
        "description": "Publish signed manifests for reproducibility.",
        "tone": "info",
        "icon": "dataset"
      },
      {
        "title": "Open data",
        "description": "Distribute verified data snapshots.",
        "tone": "primary",
        "icon": "stack"
      },
      {
        "title": "Build pipelines",
        "description": "Use the GitHub Action to sign CI outputs automatically.",
        "tone": "success",
        "icon": "terminal"
      }
    ]
  },
  "developerSection": {
    "eyebrow": "Developers",
    "title": "Browser, CLI, and CI share the same proof model",
    "description": "Seal uses the same proof format across:",
    "surfaces": [
      "Web app",
      "CLI",
      "GitHub Action"
    ],
    "tabs": [
      {
        "value": "js",
        "label": "JavaScript",
        "title": "Browser verification with shared primitives",
        "meta": "JavaScript",
        "code": "import { createSealProof, verifySealProofAgainstBytes } from \"@ternent/seal-cli/proof\"\n\nconst proof = await createSealProof({\n  signer: { privateKeyPem, publicKeyPem, keyId },\n  subject: { kind: \"file\", path: \"sample.txt\", hash: \"sha256:...\" }\n})\n\nconst verified = await verifySealProofAgainstBytes(proof, fileBuffer)",
        "supportingCopy": "Use the same proof helpers in your browser app when you want direct control over signing and verification flows.",
        "link": {
          "href": "https://github.com/samternent/home/tree/main/packages/seal-cli",
          "label": "View the shared proof package"
        }
      },
      {
        "value": "cli",
        "label": "seal-cli",
        "title": "Simple file proofs from the terminal",
        "meta": "seal-cli",
        "code": "pnpm add -D @ternent/seal-cli\n\nexport SEAL_PRIVATE_KEY=\"$(cat private-key.pem)\"\n\nseal sign --input sample.txt --out sample.proof.json\nseal verify --proof sample.proof.json --input sample.txt --json",
        "supportingCopy": "For local files, release assets, or quick automation, the CLI gives you a direct proof flow without writing app code.",
        "link": {
          "href": "https://www.npmjs.com/package/@ternent/seal-cli",
          "label": "See @ternent/seal-cli on npm"
        }
      },
      {
        "value": "action",
        "label": "GitHub Action",
        "title": "Sign static builds in CI",
        "meta": "GitHub Action",
        "code": "- uses: actions/checkout@v4\n- uses: actions/setup-node@v4\n  with:\n    node-version-file: \".nvmrc\"\n- uses: samternent/seal-action@v1\n  env:\n    SEAL_PRIVATE_KEY: ${{ secrets.SEAL_PRIVATE_KEY }}\n    SEAL_PUBLIC_KEY: ${{ secrets.SEAL_PUBLIC_KEY }}\n  with:\n    assets-directory: dist\n    package-name: @ternent/seal-cli\n    package-version: latest",
        "supportingCopy": "When your workflow already builds a static directory, Seal Action adds signed artifacts with minimal extra YAML.",
        "link": {
          "href": "https://github.com/marketplace/actions/seal-action",
          "label": "Open Seal Action on GitHub Marketplace"
        }
      }
    ]
  },
  "clarifierSection": {
    "eyebrow": "Definition",
    "title": "What Seal is and isn’t",
    "columns": [
      {
        "title": "Seal is",
        "items": [
          "A tool for signing content and static builds",
          "A way to prove integrity and signer identity",
          "Browser-first and CI-friendly"
        ]
      },
      {
        "title": "Seal is not",
        "items": [
          "Encryption",
          "A blockchain",
          "A hosted trust platform",
          "A PKI replacement"
        ]
      }
    ]
  },
  "ctaSection": {
    "eyebrow": "Ready to start?",
    "title": "Start signing your build artifacts",
    "description": "Generate a manifest, sign it, and publish a portable proof file.",
    "primaryAction": {
      "href": "/app",
      "label": "Open Web App",
      "variant": "primary"
    },
    "secondaryAction": {
      "href": "https://www.npmjs.com/package/@ternent/seal-cli",
      "label": "Install CLI",
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
        "label": "Workspace"
      },
      {
        "href": "/app/verify",
        "label": "Verify"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/apps/seal",
        "label": "GitHub"
      },
      {
        "href": "https://github.com/samternent/home",
        "label": "Monorepo"
      },
      {
        "href": "https://github.com/samternent/home/tree/main/packages/identity",
        "label": "Identity"
      }
    ]
  }
} as const satisfies LandingPageConfig;
