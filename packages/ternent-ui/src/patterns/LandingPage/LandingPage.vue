<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Card, Separator, Tabs } from "../../primitives";
import FeatureCard from "../FeatureCard/FeatureCard.vue";
import Logo from "../Logo/Logo.vue";
import PageSurface from "../PageSurface/PageSurface.vue";
import PreviewPanel from "../PreviewPanel/PreviewPanel.vue";
import SectionClarifier from "../SectionClarifier/SectionClarifier.vue";
import SectionIntro from "../SectionIntro/SectionIntro.vue";
import StepList from "../StepList/StepList.vue";
import LandingIcon from "./LandingIcon.vue";
import type {
  LandingPageAction,
  LandingPageConfig,
  LandingPageLink,
  LandingPagePreview,
} from "./LandingPage.types";

const props = defineProps<{
  appTitle?: string;
  config: LandingPageConfig;
}>();

const developerTab = ref(
  props.config.developerSection.tabs[0]?.value ?? "overview",
);

const hasDocumentationSections =
  Boolean(props.config.proofModelSection) ||
  Boolean(props.config.proofJsonSection) ||
  Boolean(props.config.surfacesSection) ||
  Boolean(props.config.staticBuildSection) ||
  Boolean(props.config.suiteSection) ||
  Boolean(props.config.nonGoalsSection);

const showTopNavigation = computed(
  () => !hasDocumentationSections && props.config.navigationLinks.length > 0,
);

function isExternalLink(href: string) {
  return /^https?:\/\//.test(href);
}

function resolveButtonProps(link: LandingPageLink | LandingPageAction) {
  if (link.href.startsWith("/")) {
    return { as: "RouterLink", to: link.href };
  }

  return {
    as: "a",
    href: link.href,
    target: isExternalLink(link.href) ? "_blank" : undefined,
    rel: isExternalLink(link.href) ? "noreferrer" : undefined,
  };
}

function resolveLinkProps(link: LandingPageLink) {
  if (link.href.startsWith("/")) {
    return { to: link.href };
  }

  return {
    href: link.href,
    target: isExternalLink(link.href) ? "_blank" : undefined,
    rel: isExternalLink(link.href) ? "noreferrer" : undefined,
  };
}

function previewTabs(preview: LandingPagePreview) {
  return preview.tabs?.map((tab) => tab.label);
}

function previewActiveTab(preview: LandingPagePreview) {
  return (
    preview.tabs?.find((tab) => tab.active)?.label ?? preview.tabs?.[0]?.label
  );
}

function resolveActionVariant(action: LandingPageAction) {
  return action.variant === "secondary" ? "secondary" : "primary";
}
</script>

<template>
  <PageSurface>
    <header class="sticky top-0 z-30 mx-auto w-full lg:px-8">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 backdrop-blur-lg"
      >
        <RouterLink to="/" class="flex items-end gap-3 no-underline">
          <Logo class="!size-8" />
          <span
            v-if="props.appTitle"
            class="hidden text-sm font-medium tracking-[0.08em] text-[var(--ui-fg-muted)] sm:inline"
          >
            {{ props.appTitle }}
          </span>
        </RouterLink>

        <nav v-if="showTopNavigation" class="hidden items-center gap-2 md:flex">
          <Button
            v-for="link in props.config.navigationLinks"
            :key="link.label"
            v-bind="resolveButtonProps(link)"
            variant="plain-secondary"
            size="sm"
          >
            {{ link.label }}
          </Button>
        </nav>

        <div class="flex items-center gap-2">
          <Button
            v-bind="resolveButtonProps(props.config.hero.primaryAction)"
            :variant="resolveActionVariant(props.config.hero.primaryAction)"
          >
            {{ props.config.hero.primaryAction.label }}
          </Button>
          <Button
            v-if="props.config.hero.secondaryAction"
            v-bind="resolveButtonProps(props.config.hero.secondaryAction)"
            :variant="resolveActionVariant(props.config.hero.secondaryAction)"
          >
            {{ props.config.hero.secondaryAction.label }}
          </Button>
          <Button
            v-if="props.config.hero.tertiaryAction"
            v-bind="resolveButtonProps(props.config.hero.tertiaryAction)"
            variant="plain-secondary"
          >
            {{ props.config.hero.tertiaryAction.label }}
          </Button>
        </div>
      </div>
      <Separator />
    </header>

    <main
      :class="
        hasDocumentationSections
          ? 'mx-auto max-w-6xl px-6 pb-28 pt-12 lg:px-8 lg:pb-32 lg:pt-16'
          : 'mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pb-28 lg:pt-24'
      "
    >
      <section
        :class="
          hasDocumentationSections
            ? 'grid items-start gap-12 lg:grid-cols-[minmax(0,1.18fr)_minmax(20rem,0.82fr)] lg:gap-18'
            : 'grid items-center gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16'
        "
      >
        <div class="min-w-0">
          <SectionIntro
            :eyebrow="props.config.hero.eyebrow"
            :title="props.config.hero.title"
            :description="props.config.hero.description"
            size="hero"
            title-tag="h1"
          >
            <template #actions>
              <Button
                v-bind="resolveButtonProps(props.config.hero.primaryAction)"
                :variant="resolveActionVariant(props.config.hero.primaryAction)"
                size="lg"
              >
                {{ props.config.hero.primaryAction.label }}
              </Button>
              <Button
                v-if="props.config.hero.secondaryAction"
                v-bind="resolveButtonProps(props.config.hero.secondaryAction)"
                :variant="
                  resolveActionVariant(props.config.hero.secondaryAction)
                "
                size="lg"
              >
                {{ props.config.hero.secondaryAction.label }}
              </Button>
              <Button
                v-if="props.config.hero.tertiaryAction"
                v-bind="resolveButtonProps(props.config.hero.tertiaryAction)"
                variant="plain-secondary"
                size="lg"
              >
                {{ props.config.hero.tertiaryAction.label }}
              </Button>
            </template>
          </SectionIntro>

          <div
            v-if="props.config.hero.supportingLine || props.config.hero.note"
            class="mt-6 space-y-3"
          >
            <p
              v-if="props.config.hero.supportingLine"
              class="m-0 max-w-2xl text-sm leading-7 text-[var(--ui-fg-muted)]"
            >
              {{ props.config.hero.supportingLine }}
            </p>
            <p
              v-if="props.config.hero.note"
              class="m-0 max-w-2xl text-sm leading-7 text-[var(--ui-fg)]"
            >
              {{ props.config.hero.note }}
            </p>
          </div>
        </div>

        <slot name="hero-preview" :preview="props.config.hero.preview">
          <PreviewPanel
            :title="props.config.hero.preview.title"
            :meta="props.config.hero.preview.meta"
            :status-label="props.config.hero.preview.statusLabel"
            :status-tone="props.config.hero.preview.statusTone"
            :rows="props.config.hero.preview.rows"
            :code="props.config.hero.preview.code"
            :tabs="previewTabs(props.config.hero.preview)"
            :active-tab="previewActiveTab(props.config.hero.preview)"
            :footer-text="props.config.hero.preview.footerText"
            emphasis="strong"
          />
        </slot>
      </section>

      <section
        v-if="props.config.proofModelSection"
        id="proof-model"
        class="pt-28"
      >
        <SectionIntro
          :eyebrow="props.config.proofModelSection.eyebrow"
          :title="props.config.proofModelSection.title"
          :description="props.config.proofModelSection.description"
        />

        <div class="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
          <div
            v-for="item in props.config.proofModelSection.items"
            :key="item.title"
            class="space-y-3 border-t border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] pt-5"
          >
            <h3
              class="m-0 text-base font-medium tracking-[-0.02em] text-[var(--ui-fg)]"
            >
              {{ item.title }}
            </h3>
            <p
              class="m-0 max-w-2xl text-sm leading-7 text-[var(--ui-fg-muted)]"
            >
              {{ item.description }}
            </p>
          </div>
        </div>
      </section>

      <section
        v-if="props.config.proofJsonSection"
        id="proof-json"
        class="pt-20"
      >
        <SectionIntro
          :eyebrow="props.config.proofJsonSection.eyebrow"
          :title="props.config.proofJsonSection.title"
          :description="props.config.proofJsonSection.description"
        />
        <slot name="proofJson" :section="props.config.proofJsonSection">
          <div
            class="mt-12 overflow-hidden rounded-[var(--ui-radius-lg)] border border-[color-mix(in_srgb,var(--ui-border)_86%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_94%,transparent)]"
          >
            <div
              class="border-b border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
            >
              proof.json
            </div>
            <pre
              class="m-0 overflow-x-auto p-6 text-[0.84rem] leading-7 text-[var(--ui-fg)]"
            ><code>{{ props.config.proofJsonSection.code }}</code></pre>
          </div>
          <p
            v-if="props.config.proofJsonSection.supportingText"
            class="mt-4 m-0 text-sm leading-7 text-[var(--ui-fg-muted)]"
          >
            {{ props.config.proofJsonSection.supportingText }}
          </p>
        </slot>
      </section>

      <section v-if="props.config.surfacesSection" id="surfaces" class="pt-24">
        <SectionIntro
          :eyebrow="props.config.surfacesSection.eyebrow"
          :title="props.config.surfacesSection.title"
          :description="props.config.surfacesSection.description"
        />

        <div
          class="mt-12 grid gap-0 border-y border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] md:grid-cols-3"
        >
          <div
            v-for="surface in props.config.surfacesSection.items"
            :key="surface.title"
            class="space-y-3 px-0 py-6 md:px-6 md:py-8 md:not-first:border-l md:not-first:border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)]"
          >
            <h3
              class="m-0 text-lg font-medium tracking-[-0.02em] text-[var(--ui-fg)]"
            >
              {{ surface.title }}
            </h3>
            <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
              {{ surface.description }}
            </p>
          </div>
        </div>
      </section>

      <section
        v-if="!hasDocumentationSections && props.config.featureSection"
        id="features"
        class="pt-24"
      >
        <SectionIntro
          :eyebrow="props.config.featureSection.eyebrow"
          :title="props.config.featureSection.title"
          :description="props.config.featureSection.description"
        />

        <div class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            v-for="feature in props.config.featureSection.items"
            :key="feature.title"
            :title="feature.title"
            :description="feature.description"
            :tone="feature.tone"
            surface="elevated"
          >
            <template #icon>
              <LandingIcon :name="feature.icon" />
            </template>
          </FeatureCard>
        </div>
      </section>

      <section
        v-if="!hasDocumentationSections && props.config.howItWorksSection"
        id="how-it-works"
        class="pt-24"
      >
        <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <PreviewPanel
            :title="props.config.howItWorksSection.preview.title"
            :meta="props.config.howItWorksSection.preview.meta"
            :status-label="props.config.howItWorksSection.preview.statusLabel"
            :status-tone="props.config.howItWorksSection.preview.statusTone"
            :rows="props.config.howItWorksSection.preview.rows"
            :code="props.config.howItWorksSection.preview.code"
            :tabs="previewTabs(props.config.howItWorksSection.preview)"
            :active-tab="
              previewActiveTab(props.config.howItWorksSection.preview)
            "
            :footer-text="props.config.howItWorksSection.preview.footerText"
          />

          <div class="flex min-w-0 flex-col gap-8">
            <SectionIntro
              :eyebrow="props.config.howItWorksSection.eyebrow"
              :title="props.config.howItWorksSection.title"
            />
            <StepList :items="props.config.howItWorksSection.steps" />
          </div>
        </div>
      </section>

      <section
        v-if="!hasDocumentationSections && props.config.useCasesSection"
        id="use-cases"
        class="pt-24"
      >
        <SectionIntro
          :eyebrow="props.config.useCasesSection.eyebrow"
          :title="props.config.useCasesSection.title"
        />

        <div class="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <Card
            v-for="useCase in props.config.useCasesSection.items"
            :key="useCase.title"
            variant="subtle"
            padding="md"
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
                <LandingIcon :name="useCase.icon" />
              </div>
            </div>
            <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
              {{ useCase.description }}
            </p>
          </Card>
        </div>
      </section>

      <section
        v-if="props.config.staticBuildSection"
        id="static-build"
        class="pt-20"
      >
        <div class="max-w-4xl">
          <SectionIntro
            :eyebrow="props.config.staticBuildSection.eyebrow"
            :title="props.config.staticBuildSection.title"
            :description="props.config.staticBuildSection.description"
          />

          <ol class="mt-10 space-y-6">
            <li
              v-for="(step, index) in props.config.staticBuildSection.steps"
              :key="step.title"
              class="flex gap-5"
            >
              <div
                class="flex size-7 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--ui-border)_90%,transparent)] text-xs font-semibold text-[var(--ui-fg-muted)]"
              >
                {{ index + 1 }}
              </div>
              <div
                class="space-y-2 border-t border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] pt-4"
              >
                <h3 class="m-0 text-base font-medium text-[var(--ui-fg)]">
                  {{ step.title }}
                </h3>
                <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
                  {{ step.description }}
                </p>
              </div>
            </li>
          </ol>
          <p
            v-if="props.config.staticBuildSection.closingLine"
            class="mt-8 m-0 text-sm leading-7 text-[var(--ui-fg)]"
          >
            {{ props.config.staticBuildSection.closingLine }}
          </p>
        </div>
      </section>

      <section id="developers" class="pt-24">
        <div
          :class="
            hasDocumentationSections
              ? 'grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start'
              : 'rounded-[var(--ui-radius-lg)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_94%,transparent)] p-8'
          "
        >
          <div class="min-w-0 flex flex-col gap-8">
            <SectionIntro
              :eyebrow="props.config.developerSection.eyebrow"
              :title="props.config.developerSection.title"
              :description="props.config.developerSection.description"
            />

            <div
              :class="
                hasDocumentationSections
                  ? 'flex flex-wrap gap-x-6 gap-y-2 border-t border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] pt-5'
                  : 'grid gap-3 sm:grid-cols-3'
              "
            >
              <div
                v-for="surface in props.config.developerSection.surfaces"
                :key="surface"
                :class="
                  hasDocumentationSections
                    ? 'text-sm text-[var(--ui-fg-muted)]'
                    : 'rounded-[var(--ui-radius-md)] border border-[var(--ui-border)] bg-[var(--ui-tonal-secondary)] px-4 py-4'
                "
              >
                <p class="m-0 text-sm font-medium text-[var(--ui-fg)]">
                  {{ surface }}
                </p>
              </div>
            </div>
          </div>

          <Tabs
            v-model="developerTab"
            :items="
              props.config.developerSection.tabs.map((tab) => ({
                value: tab.value,
                label: tab.label,
              }))
            "
            variant="pill"
            class="min-w-0"
          >
            <template
              v-for="tab in props.config.developerSection.tabs"
              :key="tab.value"
              v-slot:[`panel-${tab.value}`]
            >
              <div
                class="space-y-4 rounded-[var(--ui-radius-lg)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_94%,transparent)] p-5"
              >
                <div class="space-y-1">
                  <p
                    class="m-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"
                  >
                    {{ tab.meta }}
                  </p>
                  <h3
                    class="m-0 text-lg font-medium tracking-[-0.02em] text-[var(--ui-fg)]"
                  >
                    {{ tab.title }}
                  </h3>
                </div>
                <pre
                  class="m-0 overflow-x-auto rounded-[calc(var(--ui-radius-md)-2px)] border border-[color-mix(in_srgb,var(--ui-border)_82%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface)_90%,transparent)] p-4 text-[0.8rem] leading-6 text-[var(--ui-fg)]"
                ><code>{{ tab.code }}</code></pre>
                <p class="m-0 text-sm leading-7 text-[var(--ui-fg-muted)]">
                  {{ tab.supportingCopy }}
                </p>
                <a
                  class="text-sm text-[var(--ui-fg-muted)] underline decoration-[color-mix(in_srgb,var(--ui-border)_70%,transparent)] underline-offset-4 transition hover:text-[var(--ui-fg)]"
                  v-bind="resolveLinkProps(tab.link)"
                >
                  {{ tab.link.label }}
                </a>
              </div>
            </template>
          </Tabs>
        </div>
      </section>

      <section
        v-if="!hasDocumentationSections && props.config.clarifierSection"
        class="pt-14"
      >
        <SectionClarifier
          :eyebrow="props.config.clarifierSection.eyebrow"
          :title="props.config.clarifierSection.title"
        >
          <div class="grid gap-8 md:grid-cols-2 lg:gap-14">
            <div
              v-for="column in props.config.clarifierSection.columns"
              :key="column.title"
              class="space-y-5"
            >
              <h3
                class="m-0 mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--ui-fg)]"
              >
                {{ column.title }}
              </h3>
              <ul
                class="m-0 list-outside list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ui-fg-muted)] marker:text-[var(--ui-fg-muted)]"
              >
                <li v-for="item in column.items" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </SectionClarifier>
      </section>

      <section v-if="props.config.suiteSection" id="suite" class="pt-24">
        <Card variant="panel" padding="lg" class="space-y-5">
          <SectionIntro
            :eyebrow="props.config.suiteSection.eyebrow"
            :title="props.config.suiteSection.title"
            :description="props.config.suiteSection.description"
          />
          <p
            v-if="props.config.suiteSection.supportingText"
            class="m-0 max-w-4xl text-sm leading-7 text-[var(--ui-fg-muted)]"
          >
            {{ props.config.suiteSection.supportingText }}
          </p>
        </Card>
      </section>

      <section v-if="props.config.nonGoalsSection" class="pt-14">
        <SectionClarifier
          :eyebrow="props.config.nonGoalsSection.eyebrow || 'Boundaries'"
          :title="props.config.nonGoalsSection.title"
        >
          <Card variant="subtle" padding="lg">
            <ul
              class="m-0 list-outside list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ui-fg-muted)] marker:text-[var(--ui-fg-muted)]"
            >
              <li
                v-for="item in props.config.nonGoalsSection.items"
                :key="item"
              >
                {{ item }}
              </li>
            </ul>
          </Card>
        </SectionClarifier>
      </section>

      <section class="pt-24">
        <Card variant="elevated" padding="lg">
          <SectionIntro
            align="center"
            :eyebrow="props.config.ctaSection.eyebrow"
            :title="props.config.ctaSection.title"
            :description="props.config.ctaSection.description"
          >
            <template #actions>
              <Button
                v-bind="
                  resolveButtonProps(props.config.ctaSection.primaryAction)
                "
                :variant="
                  resolveActionVariant(props.config.ctaSection.primaryAction)
                "
                size="lg"
              >
                {{ props.config.ctaSection.primaryAction.label }}
              </Button>
              <Button
                v-if="props.config.ctaSection.secondaryAction"
                v-bind="
                  resolveButtonProps(props.config.ctaSection.secondaryAction)
                "
                :variant="
                  resolveActionVariant(props.config.ctaSection.secondaryAction)
                "
                size="lg"
              >
                {{ props.config.ctaSection.secondaryAction.label }}
              </Button>
              <Button
                v-if="props.config.ctaSection.tertiaryAction"
                v-bind="
                  resolveButtonProps(props.config.ctaSection.tertiaryAction)
                "
                variant="plain-secondary"
                size="lg"
              >
                {{ props.config.ctaSection.tertiaryAction.label }}
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
          <div
            class="flex items-center gap-3 text-sm text-[var(--ui-fg-muted)]"
          >
            <Logo class="!size-6" />
            <a
              class="text-[var(--ui-fg-muted)] no-underline transition hover:text-[var(--ui-fg)]"
              :href="props.config.footer.brandHref || '/'"
            >
              {{ props.config.footer.brandLabel }}
            </a>
            <p class="m-0">{{ props.config.footer.copyright }}</p>
            <slot name="footer-meta" />
          </div>
        </div>

        <nav class="flex flex-wrap items-center gap-2">
          <Button
            v-for="link in props.config.footer.links"
            :key="link.label"
            v-bind="resolveButtonProps(link)"
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
