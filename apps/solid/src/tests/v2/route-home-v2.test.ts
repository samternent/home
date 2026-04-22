import { flushPromises, mount, RouterLinkStub } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import RouteHome from "@/routes/app/RouteHome.vue";
import {
  configureAppApiSingletonForTests,
  resetAppApiSingletonForTests,
} from "@/app/api";

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

describe("RouteHome", () => {
  beforeEach(async () => {
    await resetAppApiSingletonForTests();
    configureAppApiSingletonForTests({
      identity: await createIdentity("2026-04-20T10:00:00.000Z"),
    });
  });

  it("renders concord host status and link to permissions", async () => {
    const wrapper = mount(RouteHome, {
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
