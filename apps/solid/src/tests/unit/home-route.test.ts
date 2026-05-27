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
          template: '<a :href="to"><slot /></a>',
        },
        PublishedSiteProofBadge: {
          template: "<span>Published site proof</span>",
        },
      },
    },
  });
}

async function clickTab(wrapper: ReturnType<typeof createWrapper>, label: string) {
  const tab = wrapper.findAll('[role="tab"]').find((candidate) => candidate.text() === label);

  expect(tab, `expected tab "${label}" to exist`).toBeTruthy();
  await tab!.trigger("click");
  await nextTick();
}

describe("RouteHome landing page", () => {
  it("renders Concord OS for Solid landing content from generated config", async () => {
    const wrapper = createWrapper();
    const text = wrapper.text();

    expect(text).toContain("A Concord OS for the ledgers, files, and apps in your Solid Pod.");
    expect(text).toContain("Platform concerns live in one shell");
    expect(text).toContain("Sign in once, then move through files, ledgers, and apps");
    expect(text).toContain("Built for interoperable ledger work, not just one app");
    expect(text).toContain("Build app surfaces on top of Solid sessions and portable ledgers");
    expect(text).toContain("What Concord OS for Solid is and isn’t");
    expect(text).toContain("Sign in with Solid and start shaping the shell.");
    expect(text).toContain("Open app");
    expect(text).toContain("View source");
    expect(text).toContain("Filesystem over Pod storage");
    expect(text).toContain("Cross-app migrations");

    expect(text).toContain("Shell");
    expect(text).toContain("Registry");
    expect(text).toContain("createSolidConcordApp");

    await clickTab(wrapper, "Registry");

    expect(wrapper.text()).toContain("file system → ledger selection → app resolution");
  });
});
