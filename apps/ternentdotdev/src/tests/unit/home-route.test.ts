import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import RouteHome from "@/routes/home/RouteHome.vue";

describe("RouteHome", () => {
  it("renders interactive runtime map content", () => {
    const wrapper = mount(RouteHome, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: '<a :href="to"><slot /></a>',
          },
          Button: {
            props: ["as", "to", "href", "size", "variant"],
            template: "<button><slot /></button>",
          },
        },
      },
    });

    const text = wrapper.text();

    expect(text).toContain("run.ternent.dev");
    expect(text).toContain("@ternent/concord");
    expect(text).toContain("@ternent/ledger");
    expect(text).toContain("@ternent/seal");
    expect(text).toContain("@ternent/armour");
    expect(text).toContain("@ternent/identity");

    expect(text).toContain("The mental model");
    expect(text).toContain("Ready to explore the runtime?");
    expect(text).toContain("Open runtime");
  });
});
