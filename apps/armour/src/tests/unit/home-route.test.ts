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
        ArmourHeroEnvelopeCard: {
          template: "<span>Armour envelope hero</span>",
        },
        LiveArmourEnvelopeJson: {
          template: "<span>Armour envelope JSON</span>",
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

    expect(text).toContain(
      "A portable encryption primitive for identity-backed age-compatible ciphertext.",
    );
    expect(text).toContain("The primitive");
    expect(text).toContain("The envelope format");
    expect(text).toContain("One encryption model. Multiple surfaces.");
    expect(text).toContain("Encrypt for identities without changing the primitive");
    expect(text).toContain("For developers");
    expect(text).toContain(
      "Create an identity. Keep the same encryption model everywhere.",
    );
    expect(text).toContain("Create identity");
    expect(text).toContain("View package source");
    expect(text).toContain("JavaScript package");
    expect(text).toContain("Browser app");

    expect(text).toContain("JavaScript");
    expect(text).toContain("Envelope");
    expect(text).toContain("Passphrase");
    expect(text).toContain('@ternent/armour');
    expect(text).toContain("Published site proof");

    await clickTab(wrapper, "Envelope");

    expect(wrapper.text()).toContain(
      "Wrap ciphertext in an optional envelope",
    );

    await clickTab(wrapper, "Passphrase");

    expect(wrapper.text()).toContain("Keep passphrase mode explicit");
  });
});
