<script setup lang="ts">
import { Button, Card, Separator } from "ternent-ui/primitives";
import {
  FeatureCard,
  Logo,
  PageSurface,
  PreviewPanel,
  SectionIntro,
  StepList,
} from "ternent-ui/patterns";

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

const heroRows = [
  { label: "Signed by", value: "9f3c4a1b…d07e12af" },
  { label: "Algorithm", value: "ECDSA-P256-SHA256" },
  { label: "Hash", value: "sha256:a3f8…c9d2" },
  { label: "Status", value: "Verified", valueTone: "success" },
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

const proofJsonCode = `{
  "version": "1",
  "type": "seal-proof",
  "algorithm": "ECDSA-P256-SHA256",
  "createdAt": "2026-03-13T12:04:21.000Z",
  "subject": {
    "kind": "file",
    "path": "sample.txt",
    "hash": "sha256:a3f8...c9d2"
  },
  "signer": {
    "publicKey": "BASE64-SPKI",
    "keyId": "9f3c4a1b...d07e12af"
  },
  "signature": "BASE64-SIGNATURE"
}`;

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

const developerExample = `import { createSealProof, verifySealProofAgainstBytes } from "@ternent/seal-cli/proof"

const proof = await createSealProof({
  signer: { privateKeyPem, publicKeyPem, keyId },
  subject: { kind: "file", path: "sample.txt", hash: "sha256:..." }
})

const verified = await verifySealProofAgainstBytes(proof, fileBuffer)`;

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

        <PreviewPanel
          title="Verification passed"
          :rows="heroRows"
          status-label="Verified"
          status-tone="success"
          emphasis="strong"
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
          <PreviewPanel
            title="Verification record"
            :tabs="['Artifact JSON', 'Preview']"
            active-tab="Artifact JSON"
            :code="proofJsonCode"
            footer-label="seal/v1"
            footer-tone="neutral"
            footer-text="Independent verification without your private key"
            emphasis="strong"
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
          <div class="grid gap-12 lg:grid-cols-[0.98fr_1.02fr] lg:items-start">
            <div class="flex flex-col gap-10">
              <SectionIntro
                eyebrow="Built on Concord"
                title="Identity and verification, separated from infrastructure"
                description="Seal is built on Concord identity primitives with deterministic signing and trust-minimal verification. No servers. No lock-in. Pure cryptography you control."
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

            <PreviewPanel
              title="Developer example"
              meta="Seal"
              :code="developerExample"
              footer-label="Verified"
              footer-tone="neutral"
              badge-mode="quiet"
              emphasis="default"
            />
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

    <footer class="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
      <Separator />
      <div
        class="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-end gap-2">
          <Logo class="size-6" />
          <div class="flex gap-1 text-sm">
            <a href="https://ternent.dev" class="hover:underline">
              ternent.dev</a
            >
            <p>© 2026.</p>
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
