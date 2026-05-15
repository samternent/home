import { flushPromises, mount } from "@vue/test-utils";
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

  it("renders placeholder copy and no route-level status blocks", async () => {
    const wrapper = mount(RouteHome);
    const placeholderVisible = await waitFor(
      () => wrapper.get('[data-test="home-v2-placeholder-text"]').text().includes("Home placeholder"),
    );
    expect(placeholderVisible).toBe(true);

    expect(wrapper.get('[data-test="home-v2-placeholder"]').text()).toContain(
      "console status bar",
    );
    expect(wrapper.find('[data-test="home-v2-error"]').exists()).toBe(false);
  });
});
