import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteApp from "@/routes/home/RouteApp.vue";

const runtimeInit = vi.fn(async () => undefined);

vi.mock("@/modules/run/core", () => ({
  useRunCoreRuntime: () => ({
    init: runtimeInit,
  }),
}));

vi.mock("@/modules/ui/components/AppShell.vue", () => ({
  default: defineComponent({
    name: "AppShell",
    render() {
      return h("div", { "data-test": "app-shell" }, this.$slots.default?.());
    },
  }),
}));

describe("RouteApp", () => {
  beforeEach(() => {
    runtimeInit.mockClear();
  });

  it("initializes the runtime and renders the nested shell outlet", () => {
    const wrapper = mount(RouteApp, {
      global: {
        stubs: {
          RouterView: {
            template: '<div data-test="router-view" />',
          },
        },
      },
    });

    expect(runtimeInit).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-test="app-shell"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true);
  });
});
