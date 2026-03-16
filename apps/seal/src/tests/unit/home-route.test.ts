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
        HeroProofArtifactCard: {
          template:
            '<div data-testid="hero-proof-artifact-card">proof.jsonseal-proofartifact.tar.gzEd25519</div>',
        },
        LivePublishedProofJson: {
          template:
            '<div data-testid="live-published-proof-json">proof.jsonLive proof verified"subject":{"path":"dist-manifest.json"}</div>',
        },
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

    expect(text).toContain("A portable proof primitive for signed artifacts.");
    expect(text).toContain(
      "Seal defines a minimal contract for producing versioned JSON proofs for files and build outputs.",
    );
    expect(text).toContain("The primitive");
    expect(text).toContain("The proof format");
    expect(text).toContain("Use it where you build");
    expect(text).toContain("Publish an artifact with its proof");
    expect(text).toContain("For developers");
    expect(text).toContain("Seal is not");
    expect(text).toContain("Start with GitHub Actions. Keep the same proof everywhere.");
    expect(text).toContain("Sign in GitHub Actions");
    expect(text).toContain("Install CLI");
    expect(text).toContain("View JavaScript API");
    expect(text).toContain("A hosted verification service");
    expect(text).toContain("A key management platform");
    expect(text).toContain("A blockchain");
    expect(text).toContain("A new cryptographic algorithm");
    expect(text).not.toContain("Open Web App");
    expect(text).not.toContain("View GitHub Action");
    expect(text).not.toContain("Common use cases");
    expect(text).not.toContain("ternent.dev suite");
    expect(text).not.toContain("Concord");
    expect(text).not.toContain("PixPax");
    expect(text).not.toContain("Browser reference app");

    for (const phrase of bannedPhrases) {
      expect(text.toLowerCase()).not.toContain(phrase);
    }

    expect(wrapper.find('a[href="#proof-model"]').exists()).toBe(false);
    expect(wrapper.find('a[href="#proof-json"]').exists()).toBe(false);
    expect(wrapper.find('a[href="#static-build"]').exists()).toBe(false);
    expect(wrapper.findAll('a[href="#surfaces"]').length).toBeGreaterThan(0);
    expect(text).toContain("proof.json");
    expect(text).toContain("seal-proof");
    expect(text).toContain("artifact.tar.gz");
    expect(text).toContain("JavaScript");
    expect(text).toContain("seal-cli");
    expect(text).toContain("GitHub Action");
    expect(text).toContain('createSealProof,');
    expect(text).toContain('verifySealProofAgainstBytes');
    expect(text).toContain('@ternent/seal-cli/proof');
    expect(wrapper.find('[data-testid="hero-proof-artifact-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="published-site-proof-preview"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid="published-site-proof-preview"]')).toHaveLength(1);

    await clickTab(wrapper, "seal-cli");

    expect(wrapper.text()).toContain("seal sign --input artifact.tar.gz --out proof.json");
    expect(
      wrapper
        .findAll('a[href="https://www.npmjs.com/package/@ternent/seal-cli"]')
        .some((link) => link.text().includes("npm")),
    ).toBe(true);

    await clickTab(wrapper, "GitHub Action");

    expect(wrapper.text()).toContain("uses: samternent/seal-action@v2");
    expect(
      wrapper
        .findAll('a[href="https://github.com/marketplace/actions/seal-action"]')
        .some((link) => link.text().includes("Marketplace")),
    ).toBe(true);
  });
});
