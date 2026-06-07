import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import RouteStorageProviders from "@/routes/app/RouteStorageProviders.vue";
import { configureAppApiSingletonForTests, resetAppApiSingletonForTests } from "@/app/api";

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

describe("RouteStorageProviders", () => {
  beforeEach(async () => {
    await resetAppApiSingletonForTests();
    configureAppApiSingletonForTests({
      identity: await createIdentity("2026-04-20T10:00:00.000Z"),
    });
  });

  it("renders storage provider management cards", async () => {
    const wrapper = mount(RouteStorageProviders);

    const rendered = await waitFor(
      () =>
        wrapper.find('[data-test="storage-providers-v1"]').exists() &&
        wrapper.find('[data-test="storage-provider-row-local"]').exists(),
    );
    expect(rendered).toBe(true);

    expect(wrapper.find('[data-test="storage-providers-active-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="storage-http-config-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="storage-providers-list-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="storage-provider-row-local"]').exists()).toBe(true);
  });
});
