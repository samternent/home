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

    expect(text).toContain("Launch a branded ternent app fast.");
    expect(text).toContain("Template-ready and on-brand");
    expect(text).toContain("Ship a new landing page in one pass");
    expect(text).toContain("Built for repeat launches");
    expect(text).toContain("The same skeleton adapts to app, CLI, and docs messaging");
    expect(text).toContain("What this template is and isn’t");
    expect(text).toContain("Scaffold the next ternent app from YAML");
    expect(text).toContain("Open settings");
    expect(text).toContain("Inspect template");
    expect(text).toContain("Product microsites");
    expect(text).toContain("Docs launchpads");

    expect(text).toContain("Manifest");
    expect(text).toContain("Sync");
    expect(text).toContain("Scaffold");
    expect(text).toContain("themeName: aurora");

    await clickTab(wrapper, "Sync");

    expect(wrapper.text()).toContain("pnpm sync:ternent-app -- --app apps/my-app");

    await clickTab(wrapper, "Scaffold");

    expect(wrapper.text()).toContain(
      "pnpm scaffold:ternent-app -- --manifest apps/my-app/app.yaml",
    );
  });
});
