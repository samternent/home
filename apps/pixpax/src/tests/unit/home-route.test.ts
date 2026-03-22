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

describe("RouteHome landing page", () => {
  it("renders the approved PixPax landing flow", () => {
    const wrapper = createWrapper();
    const text = wrapper.text();

    expect(text).toContain("Open packs. Build your Pixbook.");
    expect(text).toContain("PixPax is a digital collectible game built around issued cards, pack reveals, and a Pixbook you build over time.");
    expect(text).toContain("How it works");
    expect(text).toContain("Packs contain digitally issued cards.");
    expect(text).toContain("Each card is issued as a real digital collectible, not just a temporary app reward.");
    expect(text).toContain("Keep collecting");
    expect(text).toContain("QR cards, events, and rewards can unlock the next pack.");
    expect(text).toContain("Every reveal leaves behind a record.");
    expect(text).toContain("Powered by Concord");
    expect(text).toContain("PixPax is the first real app built on Concord.");
    expect(text).toContain("Start your Pixbook");
    expect(text).toContain("Open your first issued pack. Reveal what lands inside and start building your Pixbook.");
    expect(text).toContain("Get started");
    expect(text).not.toContain("Start with a pack");
    expect(text).not.toContain("Fair play");
    expect(wrapper.find('[data-testid="hero-logo"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-testid="sample-card"]').length).toBe(3);
  });
});
