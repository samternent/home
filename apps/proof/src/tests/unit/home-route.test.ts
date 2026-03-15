import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import RouteHome from "@/routes/home/RouteHome.vue";

const bannedPhrases = [
  "trust infrastructure",
  "prove what matters",
  "trust that travels",
  "built for trust",
  "next-generation",
  "verifiable trust",
  "infrastructure-grade",
];

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

describe("RouteHome landing page", () => {
  it("renders the updated copy and swaps developer snippets with tab changes", async () => {
    const wrapper = createWrapper();
    const text = wrapper.text();

    expect(text).toContain(
      "Sign files and static site builds. Verify them anywhere.",
    );
    expect(text).toContain("Portable signed proof artifacts");
    expect(text).toContain("How it works");
    expect(text).toContain("Common use cases");
    expect(text).toContain("Browser, CLI, and CI share the same proof model");
    expect(text).toContain("What Seal is and isn’t");
    expect(text).toContain("Start signing your build artifacts");
    expect(text).toContain("Open Web App");
    expect(text).toContain("View GitHub Action");
    expect(text).toContain("Install CLI");
    expect(text).toContain("Static websites");
    expect(text).toContain("Build pipelines");
    expect(text).toContain("A blockchain");
    expect(text).toContain("A PKI replacement");

    for (const phrase of bannedPhrases) {
      expect(text.toLowerCase()).not.toContain(phrase);
    }

    expect(text).toContain("JavaScript");
    expect(text).toContain("seal-cli");
    expect(text).toContain("GitHub Action");
    expect(text).toContain(
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
