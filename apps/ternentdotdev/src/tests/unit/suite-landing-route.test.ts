import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import RouteSuiteLanding from "@/routes/suites/_shared/RouteSuiteLanding.vue";

vi.mock("@/modules/ui", () => ({
  useThemeMode: () => ({
    mode: { value: "light" },
  }),
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRoute: () => ({
      meta: {
        suiteKey: "seal",
        suiteTheme: "proof",
      },
      params: {},
    }),
  };
});

describe("RouteSuiteLanding", () => {
  it("mirrors dark mode from root data-theme", () => {
    document.documentElement.setAttribute("data-theme", "aurora-dark");

    const wrapper = mount(RouteSuiteLanding, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: '<a :href="to"><slot /></a>',
          },
          LandingPage: {
            props: ["config", "appTitle"],
            template: "<div data-landing>{{ appTitle }}</div>",
          },
        },
      },
    });

    const surface = wrapper.get(".suite-route__theme-surface");
    expect(surface.attributes("data-theme")).toBe("proof-dark");
  });

  it("applies suite theme data attribute", () => {
    const wrapper = mount(RouteSuiteLanding, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: '<a :href="to"><slot /></a>',
          },
          LandingPage: {
            props: ["config", "appTitle"],
            template: "<div data-landing>{{ appTitle }}</div>",
          },
        },
      },
    });

    const surface = wrapper.get(".suite-route__theme-surface");
    expect(surface.attributes("data-theme")).toBe("proof-light");
    expect(wrapper.text()).toContain("Seal");
  });
});
