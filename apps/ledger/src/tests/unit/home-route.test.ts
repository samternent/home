import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { appConfig, landingPageConfig } from "@/app/config/app.config";
import RouteHome from "@/routes/home/RouteHome.vue";

function createWrapper() {
  return mount(RouteHome, {
    global: {
      stubs: {
        RouterLink: {
          props: ["to"],
          template: "<a :href=\"to\"><slot /></a>",
        },
        PublishedSiteProofBadge: {
          template: "<span>Published site proof</span>",
        },
      },
    },
  });
}

async function clickTab(
  wrapper: ReturnType<typeof createWrapper>,
  label: string,
) {
  const tab = wrapper
    .findAll('[role="tab"]')
    .find((candidate) => candidate.text() === label);

  expect(tab, `expected tab "${label}" to exist`).toBeTruthy();
  await tab!.trigger("click");
  await nextTick();
}

describe("RouteHome landing page", () => {
  it("renders template landing content from generated config", async () => {
    const wrapper = createWrapper();
    const text = wrapper.text();
    const tabs = landingPageConfig.developerSection.tabs;

    expect(text).toContain(landingPageConfig.hero.title);
    expect(text).toContain(landingPageConfig.hero.preview.title);
    expect(text).toContain(landingPageConfig.featureSection.title);
    expect(text).toContain(landingPageConfig.howItWorksSection.title);
    expect(text).toContain(landingPageConfig.developerSection.title);
    expect(text).toContain(landingPageConfig.clarifierSection.title);
    expect(text).toContain(landingPageConfig.hero.primaryAction.label);
    expect(text).toContain(landingPageConfig.hero.secondaryAction.label);
    expect(text).toContain(landingPageConfig.ctaSection.title);
    expect(text).toContain(landingPageConfig.useCasesSection.items[0]?.title ?? "");
    expect(text).toContain(landingPageConfig.useCasesSection.items[1]?.title ?? "");

    expect(text).toContain(tabs[0]?.label ?? "");
    expect(text).toContain(tabs[1]?.label ?? "");
    expect(text).toContain(tabs[2]?.label ?? "");
    expect(text).toContain(
      landingPageConfig.hero.preview.rows[0]?.value ?? `${appConfig.themeName}-${appConfig.defaultThemeMode}`,
    );

    await clickTab(wrapper, tabs[1]?.label ?? "");

    expect(wrapper.text()).toContain(tabs[1]?.code ?? "");

    await clickTab(wrapper, tabs[2]?.label ?? "");

    expect(wrapper.text()).toContain(tabs[2]?.code ?? "");
  });
});
