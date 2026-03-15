import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import RouteHome from "@/routes/home/RouteHome.vue";

function createWrapper() {
  return mount(RouteHome, {
    global: {
      stubs: {
        PublishedSiteProofPreview: {
          template: "<div data-testid=\"published-site-proof-preview\" />",
        },
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

describe("RouteHome developers section", () => {
  it("renders the developer tabs and swaps snippets with tab changes", async () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain("JavaScript");
    expect(wrapper.text()).toContain("seal-cli");
    expect(wrapper.text()).toContain("GitHub Action");
    expect(wrapper.text()).toContain(
      'import { createSealProof, verifySealProofAgainstBytes } from "@ternent/seal-cli/proof"',
    );

    await clickTab(wrapper, "seal-cli");

    expect(wrapper.text()).toContain("pnpm add -D @ternent/seal-cli");
    expect(
      wrapper
        .findAll('a[href="https://www.npmjs.com/package/@ternent/seal-cli"]')
        .some((link) => link.text().includes("npm")),
    ).toBe(true);

    await clickTab(wrapper, "GitHub Action");

    expect(wrapper.text()).toContain("uses: samternent/seal-action@v1");
    expect(
      wrapper
        .findAll('a[href="https://github.com/marketplace/actions/seal-action"]')
        .some((link) => link.text().includes("Marketplace")),
    ).toBe(true);
  });
});
