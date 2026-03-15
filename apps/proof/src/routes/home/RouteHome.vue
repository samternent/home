<script setup lang="ts">
import { ref } from "vue";
import { Button, Card, Separator, Tabs } from "ternent-ui/primitives";
import {
  FeatureCard,
  Logo,
  PageSurface,
  PreviewPanel,
  SectionIntro,
  StepList,
} from "ternent-ui/patterns";
import { appConfig } from "@/app/config/app.config";
import PublishedSiteProofPreview from "@/modules/proof/components/PublishedSiteProofPreview.vue";

const navigationLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#developers", label: "Developers" },
];

const featureCards = [
  {
    title: "Browser-native",
    description: "Sign and verify without leaving your workspace.",
    tone: "info",
  },
  {
    title: "Deterministic identity",
    description: "Keys derived locally and never stored.",
    tone: "primary",
  },
  {
    title: "Travel-ready proofs",
    description: "Self-contained artifacts you can carry anywhere.",
    tone: "accent",
  },
  {
    title: "No backend required",
    description: "Everything runs client-side, from signing to verification.",
    tone: "success",
  },
];

const howItWorksSteps = [
  {
    title: "Generate your identity",
    description:
      "Create a deterministic keypair in one click or import one you already trust.",
  },
  {
    title: "Sign your content",
    description:
      "Hash any text or file in seconds and produce a signed proof artifact.",
  },
  {
    title: "Verify anywhere",
    description:
      "Anyone can independently verify the proof without your private key or your app.",
  },
];

const useCases = [
  {
    title: "Blog posts",
    description: "Publish authorship and integrity together.",
    tone: "primary",
  },
  {
    title: "Release artifacts",
    description: "Attach proofs to builds and downloadable assets.",
    tone: "secondary",
  },
  {
    title: "Legal documents",
    description: "Capture exactly what was signed and when.",
    tone: "accent",
  },
  {
    title: "Research papers",
    description: "Assert provenance for revisions and datasets.",
    tone: "info",
  },
  {
    title: "Static websites",
    description: "Ship verifiable proofs alongside published content.",
    tone: "primary",
  },
  {
    title: "Open data",
    description: "Distribute trusted records without central gatekeepers.",
    tone: "success",
  },
];

const developerPoints = [
  {
    title: "Prove integrity",
    description:
      "Cryptographically assert that content is exactly as you created it.",
  },
  {
    title: "Control identity",
    description:
      "Your keys remain yours, with no third party holding your identity.",
  },
  {
    title: "Audit everything",
    description: "Create a verifiable record of who signed what and when.",
  },
] as const;

type DeveloperTab = "js" | "cli" | "action";

type DeveloperPanel = {
  title: string;
  meta: string;
  code: string;
  supportingCopy: string;
  link: {
    href: string;
    label: string;
  };
};

const developerTab = ref<DeveloperTab>("js");

const developerTabs = [
  { value: "js", label: "JavaScript" },
  { value: "cli", label: "seal-cli" },
  { value: "action", label: "GitHub Action" },
] as const;

const developerPanels: Record<DeveloperTab, DeveloperPanel> = {
  js: {
    title: "Browser verification with shared primitives",
    meta: "JavaScript",
    code: `import { createSealProof, verifySealProofAgainstBytes } from "@ternent/seal-cli/proof"

const proof = await createSealProof({
  signer: { privateKeyPem, publicKeyPem, keyId },
  subject: { kind: "file", path: "sample.txt", hash: "sha256:..." }
})

const verified = await verifySealProofAgainstBytes(proof, fileBuffer)`,
    supportingCopy:
      "Use the same proof helpers in your browser app when you want direct control over signing and verification flows.",
    link: {
      href: "https://github.com/samternent/home/tree/main/packages/seal-cli",
      label: "View the shared proof package",
    },
  },
  cli: {
    title: "Simple file proofs from the terminal",
    meta: "seal-cli",
    code: `pnpm add -D @ternent/seal-cli

export SEAL_PRIVATE_KEY="$(cat private-key.pem)"

seal sign --input sample.txt --out sample.proof.json
seal verify --proof sample.proof.json --input sample.txt --json`,
    supportingCopy:
      "For local files, release assets, or quick automation, the CLI gives you a direct proof flow without writing app code.",
    link: {
      href: "https://www.npmjs.com/package/@ternent/seal-cli",
      label: "See @ternent/seal-cli on npm",
    },
  },
  action: {
    title: "Sign static builds in CI",
    meta: "GitHub Action",
    code: `- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version-file: ".nvmrc"
- uses: samternent/seal-action@v1
  env:
    SEAL_PRIVATE_KEY: \${{ secrets.SEAL_PRIVATE_KEY }}
    SEAL_PUBLIC_KEY: \${{ secrets.SEAL_PUBLIC_KEY }}
  with:
    assets-directory: dist
    package-name: @ternent/seal-cli
    package-version: latest`,
    supportingCopy:
      "When your workflow already builds a static directory, Seal Action adds signed artifacts with minimal extra YAML.",
    link: {
      href: "https://github.com/marketplace/actions/seal-action",
      label: "Open Seal Action on GitHub Marketplace",
    },
  },
};

const footerLinks = [
  { href: "/app", label: "Workspace" },
  { href: "/app/verify", label: "Verify" },
  {
    href: "https://github.com/samternent/home/tree/main/apps/proof",
    label: "GitHub",
  },
  { href: "https://github.com/samternent/home", label: "Monorepo" },
  {
    href: "https://github.com/samternent/home/tree/main/packages/identity",
    label: "Identity",
  },
];

const publishedSiteBaseUrl = import.meta.env.DEV
  ? "/_seal"
  : `https://${appConfig.defaultHost}`;
</script>

<template>
  <PageSurface>
    <header class="mx-auto lg:px-8 sticky top-0 z-30">
      <div
        class="flex items-center justify-between gap-6 px-6 py-3 backdrop-blur-lg max-w-7xl mx-auto"
      >
        <RouterLink to="/" class="flex items-end gap-3">
          <Logo class="size-9" />
        </RouterLink>

        <nav class="hidden items-center gap-2 md:flex">
          <Button
            v-for="link in navigationLinks"
            :key="link.label"
            as="a"
            :href="link.href"
            variant="plain-secondary"
            size="sm"
          >
            {{ link.label }}
          </Button>
        </nav>

        <div class="flex items-center gap-2">
          <Button
            as="RouterLink"
            to="/app/verify"
            variant="secondary"
            size="sm"
          >
            Verify
          </Button>
          <Button as="RouterLink" to="/app/sign" size="sm"> Sign </Button>
        </div>
      </div>
      <Separator />
    </header>

    <main class="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
      <section
        class="grid items-center gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16"
      >
        <SectionIntro
          eyebrow="ternent.dev"
          title="Seal anything. Verify anywhere."
          description="Seal turns text and files into verifiable proof artifacts directly in your browser. No accounts. No backend. Just math, keys, and integrity."
          size="hero"
          title-tag="h1"
        >
          <template #actions>
            <Button
              as="RouterLink"
              to="/app/verify"
              variant="secondary"
              size="lg"
            >
              Verify
            </Button>
            <Button as="RouterLink" to="/app/sign" size="lg"> Sign </Button>
          </template>
        </SectionIntro>

        <PublishedSiteProofPreview
          mode="details"
          headline="Verified proof"
          :base-url="publishedSiteBaseUrl"
          variant="full"
        />
      </section>

      <section id="features" class="pt-24">
        <SectionIntro
          eyebrow="Features"
          title="Built for trust, not platforms"
          description="Seal handles the cryptography so you can focus on proving what matters."
        />

        <div class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            v-for="feature in featureCards"
            :key="feature.title"
            :title="feature.title"
            :description="feature.description"
            :tone="feature.tone"
            surface="elevated"
          >
            <template #icon>
              <svg
                v-if="feature.title === 'Browser-native'"
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a14 14 0 0 1 0 18" />
                <path d="M12 3a14 14 0 0 0 0 18" />
              </svg>
              <svg
                v-else-if="feature.title === 'Deterministic identity'"
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M12 3a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Z"
                />
                <path d="M12 8v5" />
                <path d="M9.5 10.5h5" />
              </svg>
              <svg
                v-else-if="feature.title === 'Travel-ready proofs'"
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"
                />
                <path d="M14 3v5h5" />
                <path d="M9 13h6" />
                <path d="M9 17h6" />
              </svg>
              <svg
                v-else
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="m8 12 2.5 2.5L16 9" />
              </svg>
            </template>
          </FeatureCard>
        </div>
      </section>

      <section id="how-it-works" class="pt-24">
        <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <PublishedSiteProofPreview
            mode="details"
            headline="Verification record"
            :base-url="publishedSiteBaseUrl"
            variant="full"
            show-raw-proof
          />

          <div class="flex flex-col gap-8">
            <SectionIntro
              eyebrow="How it works"
              title="Three steps to seal any record"
              description="Generate your identity, sign your content, and share a signed artifact that anyone can verify."
            />
            <StepList :items="howItWorksSteps" />
          </div>
        </div>
      </section>

      <section id="use-cases" class="pt-24">
        <SectionIntro
          eyebrow="Use cases"
          title="Trust that travels with your work"
          description="Sign once. Verify anywhere."
        />

        <div class="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <Card
            v-for="useCase in useCases"
            :key="useCase.title"
            :variant="
              useCase.title === 'Release artifacts' ? 'panel' : 'subtle'
            "
            :padding="useCase.title === 'Release artifacts' ? 'md' : 'sm'"
            class="space-y-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-2">
                <h3
                  class="m-0 text-xl font-medium tracking-[-0.02em] text-[var(--ui-fg)]"
                >
                  {{ useCase.title }}
                </h3>
              </div>
              <div
                class="inline-flex size-10 items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] text-[var(--ui-fg-muted)]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    v-if="useCase.title === 'Release artifacts'"
                    d="m12 3 8 4.5v9L12 21 4 16.5v-9L12 3Z"
                  />
                  <template v-else-if="useCase.title === 'Open data'">
                    <path d="M12 3a9 9 0 1 0 9 9" />
                    <path d="M12 12V3" />
                    <path d="M12 12h9" />
                  </template>
                  <template v-else>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M8 10h8" />
                    <path d="M8 14h8" />
                  </template>
                </svg>
              </div>
            </div>
            <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
              {{ useCase.description }}
            </p>
          </Card>
        </div>
      </section>

      <section id="developers" class="pt-24">
        <Card
          variant="panel"
          padding="lg"
          class="border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)]"
        >
          <div
            class="grid gap-12 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] lg:items-start"
          >
            <div class="min-w-0 flex flex-col gap-10">
              <SectionIntro
                eyebrow="Built on Concord"
                title="Identity and verification, separated from infrastructure"
                description="Seal is built on Concord identity primitives with deterministic signing and trust-minimal verification. Use the same model in the browser, from the terminal, or inside CI."
              />

              <Separator />

              <div class="grid gap-5 sm:grid-cols-3">
                <FeatureCard
                  v-for="point in developerPoints"
                  :key="point.title"
                  :title="point.title"
                  :description="point.description"
                  size="sm"
                  tone="primary"
                  surface="subtle"
                />
              </div>
            </div>

            <Tabs
              v-model="developerTab"
              :items="developerTabs"
              variant="pill"
              class="min-w-0"
            >
              <template #panel-js>
                <PreviewPanel
                  :title="developerPanels.js.title"
                  :meta="developerPanels.js.meta"
                  badge-mode="quiet"
                  emphasis="default"
                >
                  <div class="space-y-4">
                    <pre
                      class="m-0 overflow-x-auto rounded-[calc(var(--ui-radius-md)-2px)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] p-4 text-[0.8rem] leading-6 text-[var(--ui-fg)]"
                    ><code>{{ developerPanels.js.code }}</code></pre>
                    <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
                      {{ developerPanels.js.supportingCopy }}
                    </p>
                    <a
                      class="text-sm text-[var(--ui-fg-muted)] underline decoration-[color-mix(in_srgb,var(--ui-border)_70%,transparent)] underline-offset-4 transition hover:text-[var(--ui-fg)]"
                      :href="developerPanels.js.link.href"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {{ developerPanels.js.link.label }}
                    </a>
                  </div>
                </PreviewPanel>
              </template>

              <template #panel-cli>
                <PreviewPanel
                  :title="developerPanels.cli.title"
                  :meta="developerPanels.cli.meta"
                  badge-mode="quiet"
                  emphasis="default"
                >
                  <div class="space-y-4">
                    <pre
                      class="m-0 overflow-x-auto rounded-[calc(var(--ui-radius-md)-2px)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] p-4 text-[0.8rem] leading-6 text-[var(--ui-fg)]"
                    ><code>{{ developerPanels.cli.code }}</code></pre>
                    <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
                      {{ developerPanels.cli.supportingCopy }}
                    </p>
                    <a
                      class="text-sm text-[var(--ui-fg-muted)] underline decoration-[color-mix(in_srgb,var(--ui-border)_70%,transparent)] underline-offset-4 transition hover:text-[var(--ui-fg)]"
                      :href="developerPanels.cli.link.href"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {{ developerPanels.cli.link.label }}
                    </a>
                  </div>
                </PreviewPanel>
              </template>

              <template #panel-action>
                <PreviewPanel
                  :title="developerPanels.action.title"
                  :meta="developerPanels.action.meta"
                  badge-mode="quiet"
                  emphasis="default"
                >
                  <div class="space-y-4">
                    <pre
                      class="m-0 overflow-x-auto rounded-[calc(var(--ui-radius-md)-2px)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_88%,transparent)] p-4 text-[0.8rem] leading-6 text-[var(--ui-fg)]"
                    ><code>{{ developerPanels.action.code }}</code></pre>
                    <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
                      {{ developerPanels.action.supportingCopy }}
                    </p>
                    <a
                      class="text-sm text-[var(--ui-fg-muted)] underline decoration-[color-mix(in_srgb,var(--ui-border)_70%,transparent)] underline-offset-4 transition hover:text-[var(--ui-fg)]"
                      :href="developerPanels.action.link.href"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {{ developerPanels.action.link.label }}
                    </a>
                  </div>
                </PreviewPanel>
              </template>
            </Tabs>
          </div>
        </Card>
      </section>

      <section class="pt-24">
        <Card variant="elevated" padding="lg">
          <SectionIntro
            align="center"
            eyebrow="Ready to start?"
            title="Ship verifiable integrity into your workflow"
            description="Sign your first artifact in seconds and bring verifiable trust to text, files, and release pipelines."
          >
            <template #actions>
              <Button as="RouterLink" to="/app/sign" size="lg"> Sign </Button>
              <Button
                as="RouterLink"
                to="/app/verify"
                variant="secondary"
                size="lg"
              >
                Review verification
              </Button>
            </template>
          </SectionIntro>
        </Card>
      </section>
    </main>

    <footer class="mx-auto max-w-7xl px-6 pb-4 lg:px-8">
      <Separator />
      <div
        class="flex flex-col gap-6 py-8 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="flex flex-col items-start gap-3">
          <div class="flex items-end gap-3 text-sm">
            <Logo class="size-6" />
            <a href="https://ternent.dev" class="hover:underline">
              ternent.dev</a
            >
            <p>© 2026.</p>
            <PublishedSiteProofPreview
              mode="badge"
              :base-url="publishedSiteBaseUrl"
              with-popover
            />
          </div>
        </div>

        <nav class="flex flex-wrap items-center gap-2">
          <Button
            v-for="link in footerLinks"
            :key="link.label"
            as="a"
            :href="link.href"
            :target="link.href.startsWith('http') ? '_blank' : undefined"
            :rel="link.href.startsWith('http') ? 'noreferrer' : undefined"
            variant="plain-secondary"
            size="sm"
          >
            {{ link.label }}
          </Button>
        </nav>
      </div>
    </footer>
  </PageSurface>
</template>
