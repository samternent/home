import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
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
  it("renders armour landing content from generated config", async () => {
    const wrapper = createWrapper();
    const text = wrapper.text();

    expect(text).toContain("Encrypt text and files in the browser.");
    expect(text).toContain("Browser-first encryption with real portability");
    expect(text).toContain("Encrypt locally, then share the result");
    expect(text).toContain("Common use cases");
    expect(text).toContain("A browser wrapper over rage-compatible encryption flows");
    expect(text).toContain("What Armour is and isn’t");
    expect(text).toContain("Encrypt locally with Armour");
    expect(text).toContain("Open Web App");
    expect(text).toContain("View source");
    expect(text).toContain("Private notes");
    expect(text).toContain("Local-first experiments");

    expect(text).toContain("JavaScript");
    expect(text).toContain("Output");
    expect(text).toContain("Workflow");
    expect(text).toContain('@ternent/armour');

    await clickTab(wrapper, "Output");

    expect(wrapper.text()).toContain("Portable encrypted output");

    await clickTab(wrapper, "Workflow");

    expect(wrapper.text()).toContain("Browser-first local encryption");
  });
});
