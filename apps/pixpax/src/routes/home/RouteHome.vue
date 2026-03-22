<script setup lang="ts">
import { PageSurface, SectionIntro } from "ternent-ui/patterns";
import { Button, Card, Separator } from "ternent-ui/primitives";
import { appConfig } from "@/app/config/app.config";
import PixpaxLogoText from "@/modules/ui/components/PixpaxLogoText.vue";
import {
  finalCtaSection,
  footerLinks,
  heroBundle,
  heroCards,
  heroContent,
  keepGoingSection,
  whyItFeelsGoodSection,
} from "./homeContent";
import PixpaxLandingHero from "./components/PixpaxLandingHero.vue";
import PixpaxLandingInfoCard from "./components/PixpaxLandingInfoCard.vue";
import PixpaxLandingSectionHeader from "./components/PixpaxLandingSectionHeader.vue";

type LinkItem = {
  href: string;
  label: string;
};

function isExternalLink(href: string) {
  return /^https?:\/\//.test(href);
}

function resolveButtonProps(link: LinkItem) {
  if (link.href.startsWith("/")) {
    return { as: "RouterLink" as const, to: link.href };
  }

  return {
    as: "a" as const,
    href: link.href,
    target: isExternalLink(link.href) ? "_blank" : undefined,
    rel: isExternalLink(link.href) ? "noreferrer" : undefined,
  };
}

function resolveLinkProps(link: LinkItem) {
  if (link.href.startsWith("/")) {
    return { to: link.href };
  }

  return {
    href: link.href,
    target: isExternalLink(link.href) ? "_blank" : undefined,
    rel: isExternalLink(link.href) ? "noreferrer" : undefined,
  };
}
</script>

<template>
  <PageSurface>
    <header class="pixpax-header">
      <div
        class="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-3"
      >
        <RouterLink to="/" class="flex items-center gap-3 no-underline">
          <span
            class="flex size-10 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)]"
          >
            <span
              class="size-4 rounded-[0.35rem] bg-[linear-gradient(135deg,var(--ui-primary),var(--ui-accent))]"
            />
          </span>
          <PixpaxLogoText class="h-4 w-auto text-[var(--ui-fg)]" />
        </RouterLink>

        <Button
          v-bind="
            resolveButtonProps({
              href: '/app/pixbook',
              label: heroContent.ctaLabel,
            })
          "
          size="sm"
        >
          {{ heroContent.ctaLabel }}
        </Button>
      </div>
    </header>

    <main class="mx-auto flex max-w-[66rem] flex-col px-6 pb-24 pt-4">
      <PixpaxLandingHero
        :headline="heroContent.headline"
        :supporting="heroContent.supporting"
        :cta-label="heroContent.ctaLabel"
        :bundle="heroBundle"
        :cards="heroCards"
      />

      <section class="pixpax-section pixpax-section--light">
        <div class="pixpax-section__inner">
          <div class="pixpax-section__stack">
            <PixpaxLandingSectionHeader
              :title="whyItFeelsGoodSection.title"
              :description="whyItFeelsGoodSection.supporting"
            />

            <div class="grid gap-6 lg:grid-cols-3">
              <PixpaxLandingInfoCard
                v-for="item in whyItFeelsGoodSection.items"
                :key="item.title"
                :title="item.title"
                :description="item.description"
                :icon-label="item.iconLabel"
                :tone="item.tone"
                surface="subtle"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="pixpax-section">
        <div class="pixpax-progression">
          <div class="pixpax-progression__copy">
            <PixpaxLandingSectionHeader :title="keepGoingSection.title" />

            <div class="pixpax-progression__lines">
              <p
                v-for="line in keepGoingSection.supporting"
                :key="line"
                class="pixpax-progression__line"
              >
                {{ line }}
              </p>
            </div>
          </div>

          <div class="pixpax-progression__cards">
            <PixpaxLandingInfoCard
              v-for="item in keepGoingSection.items"
              :key="item.title"
              :title="item.title"
              :description="item.description"
              :icon-label="item.iconLabel"
              :tone="item.tone"
              surface="subtle"
              compact
            />
          </div>
        </div>
      </section>

      <section class="pixpax-final-cta">
        <Card variant="elevated" padding="lg" class="pixpax-final-cta__card">
          <SectionIntro
            :title="finalCtaSection.title"
            :description="finalCtaSection.description"
            size="compact"
            align="center"
          >
            <template #actions>
              <Button
                v-bind="
                  resolveButtonProps({
                    href: '/app/pixbook',
                    label: finalCtaSection.ctaLabel,
                  })
                "
                size="lg"
              >
                {{ finalCtaSection.ctaLabel }}
              </Button>
            </template>
            <div class="pixpax-final-cta__details">
              <span
                v-for="detail in finalCtaSection.details"
                :key="detail"
                class="pixpax-final-cta__detail"
              >
                {{ detail }}
              </span>
            </div>
          </SectionIntro>
        </Card>
      </section>
    </main>

    <footer class="mx-auto w-full max-w-[72rem] px-6 pb-8">
      <Separator />
      <div
        class="flex flex-col gap-5 py-6 text-sm text-[var(--ui-fg-muted)] md:flex-row md:items-center md:justify-between"
      >
        <div class="space-y-2">
          <PixpaxLogoText class="h-4 w-auto text-[var(--ui-fg)]" />
          <p class="m-0">
            {{ appConfig.defaultHost }}
          </p>
        </div>

        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <component
            :is="link.href.startsWith('/') ? 'RouterLink' : 'a'"
            v-for="link in footerLinks"
            :key="link.label"
            v-bind="resolveLinkProps(link)"
            class="text-sm text-[var(--ui-fg-muted)] no-underline transition-colors hover:text-[var(--ui-fg)]"
          >
            {{ link.label }}
          </component>
        </div>
      </div>
    </footer>
  </PageSurface>
</template>

<style scoped>
.pixpax-section {
  padding: 4rem 0;
}

.pixpax-section__stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

:deep(.ui-page-surface) {
  background: transparent;
}

:deep(.ui-page-surface__content) {
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.pixpax-header {
  position: sticky;
  top: 0;
  z-index: 30;
  width: 100%;
  background: color-mix(in srgb, var(--ui-bg) 58%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ui-border) 72%, transparent);
  backdrop-filter: blur(16px) saturate(120%);
  -webkit-backdrop-filter: blur(16px) saturate(120%);
}

.pixpax-section--light {
  position: relative;
  isolation: isolate;
  left: 50%;
  width: 100vw;
  margin-left: -50vw;
  margin-right: -50vw;
  margin-top: 2rem;
  margin-bottom: 3rem;
  padding: 4.5rem 0;
  color: #0f172a;
  overflow: visible;
}

.pixpax-section--light::before {
  content: "";
  position: absolute;
  left: -6vw;
  right: -6vw;
  top: -3rem;
  bottom: -3rem;
  z-index: -1;
  transform: skewY(-0.5deg);
  transform-origin: center;
  border-top: 1px solid color-mix(in srgb, var(--ui-primary) 36%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ui-accent) 16%, transparent);
  background: color-mix(in srgb, var(--ui-bg) 55%, transparent);
  box-shadow: 0 20px 50px rgba(8, 10, 24, 0.14),
    inset 0 24px 48px color-mix(in srgb, var(--ui-bg) 26%, transparent),
    inset 0 -24px 48px color-mix(in srgb, var(--ui-bg) 22%, transparent);
  backdrop-filter: blur(16px) saturate(120%);
}

.pixpax-section__inner {
  width: 100%;
  max-width: 66rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.pixpax-section--light .pixpax-section__stack {
  gap: 1.75rem;
}

.pixpax-section--light :deep(.ui-section-intro) {
  gap: 0.5rem;
}

.pixpax-section--light :deep(.ui-section-intro),
.pixpax-section--light :deep(.ui-section-intro__title) {
  color: var(--ui-fg);
}

.pixpax-section--light :deep(.ui-section-intro__description),
.pixpax-section--light :deep(.ui-section-intro__eyebrow) {
  color: var(--ui-fg-muted);
}

.pixpax-progression {
  display: grid;
  gap: 2rem;
}

.pixpax-progression__copy {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.pixpax-progression__lines {
  display: flex;
  max-width: 32rem;
  flex-direction: column;
  gap: 0.85rem;
}

.pixpax-progression__line {
  margin: 0;
  color: var(--ui-fg-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.pixpax-progression__cards {
  display: grid;
  gap: 1rem;
}

.pixpax-final-cta {
  margin-top: 4.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.pixpax-final-cta__card {
  border-color: rgba(255, 255, 255, 0.06);
  border-radius: 1.5rem;
  background: color-mix(in srgb, var(--ui-surface) 55%, transparent);
  box-shadow: 0 18px 46px rgba(8, 10, 24, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(14px) saturate(115%);
}

.pixpax-final-cta :deep(.ui-section-intro__title),
.pixpax-final-cta :deep(.ui-section-intro__description) {
  max-width: 36rem;
  margin-inline: auto;
}

.pixpax-final-cta :deep(.ui-section-intro__actions) {
  justify-content: center;
}

.pixpax-final-cta__details {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.pixpax-final-cta__detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.25rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: color-mix(in srgb, var(--ui-fg) 90%, white 10%);
  font-size: 0.84rem;
  line-height: 1;
  letter-spacing: 0.01em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

@media (max-width: 767px) {
  .pixpax-section {
    padding: 3rem 0;
  }

  .pixpax-section--light {
    margin-top: 1.5rem;
    margin-bottom: 2.25rem;
    padding: 3.75rem 0;
  }

  .pixpax-section--light::before {
    left: -10vw;
    right: -10vw;
    top: -2rem;
    bottom: -2rem;
    transform: skewY(-0.8deg);
  }

  .pixpax-final-cta {
    margin-top: 3.75rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
}

@media (min-width: 1024px) {
  .pixpax-progression {
    grid-template-columns: minmax(0, 1.1fr) minmax(20rem, 0.9fr);
    align-items: start;
    gap: 3rem;
  }
}
</style>
