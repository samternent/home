import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import RouteHomeV2 from "@/routes/v2/RouteHomeV2.vue";
import { resetAppApiSingletonForTests } from "@/app/api";

async function waitFor(check: () => boolean): Promise<boolean> {
  for (let attempt = 0; attempt < 400; attempt += 1) {
    await flushPromises();
    if (check()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  return false;
}

describe("RouteHomeV2", () => {
  beforeEach(async () => {
    await resetAppApiSingletonForTests();
  });

  it("renders concord host status and link to permissions", async () => {
    const wrapper = mount(RouteHomeV2, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    });
    const ready = await waitFor(
      () => wrapper.get('[data-test="home-v2-status"]').text() === "ready",
    );
    expect(ready).toBe(true);

    expect(wrapper.get('[data-test="home-v2"]').text()).toContain(
      "Concord host is active",
    );
    expect(wrapper.get('[data-test="home-v2-status"]').text()).toBe("ready");
    expect(wrapper.get('[data-test="home-v2-active-identity"]').text()).toContain("User");
    expect(wrapper.get('[data-test="home-v2-integrity"]').text()).toBe("yes");

    const link = wrapper.getComponent(RouterLinkStub);
    expect(link.props("to")).toBe("/permissions");
  });
});
