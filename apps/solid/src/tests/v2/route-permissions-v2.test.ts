import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import RoutePermissionsV2 from "@/routes/v2/RoutePermissionsV2.vue";
import {
  DEFAULT_CONCORD_STORAGE_KEY,
  DEFAULT_IDENTITY_STORAGE_KEY,
} from "@/app/runtime";
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

describe("RoutePermissionsV2", () => {
  beforeEach(async () => {
    await resetAppApiSingletonForTests();
    localStorage.removeItem(DEFAULT_CONCORD_STORAGE_KEY);
    localStorage.removeItem(DEFAULT_IDENTITY_STORAGE_KEY);
  });

  it("stages create/grant/revoke and supports commit/discard", async () => {
    const wrapper = mount(RoutePermissionsV2);
    const ready = await waitFor(
      () => wrapper.get('[data-test="permissions-v2-status"]').text().includes("ready"),
    );
    expect(ready).toBe(true);

    expect(wrapper.get('[data-test="permissions-v2-active-identity"]').text()).toContain(
      "User",
    );
    expect(wrapper.find('[data-test="permissions-empty"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="permissions-v2-staged-count"]').text()).toContain("0");

    await wrapper.get('[data-test="permission-create-title"]').setValue("Reviewers");
    await wrapper.get('[data-test="permission-create-scope"]').setValue("workspace");
    await wrapper.get('[data-test="permission-create-form"]').trigger("submit");
    const created = await waitFor(
      () => wrapper.find('[data-test="permissions-empty"]').exists() === false,
    );
    expect(created).toBe(true);

    expect(wrapper.find('[data-test="permissions-empty"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="permissions-v2-staged-count"]').text()).toContain("1");
    expect(wrapper.get('[data-test^="permission-title-"]').text()).toContain(
      "Reviewers",
    );

    await wrapper
      .get('[data-test^="permission-grant-member-id-"]')
      .setValue("member:7");
    await wrapper
      .get('[data-test^="permission-grant-member-label-"]')
      .setValue("Morgan");
    await wrapper.get('[data-test^="permission-grant-form-"]').trigger("submit");
    const granted = await waitFor(() => wrapper.text().includes("member:7"));
    expect(granted).toBe(true);

    await wrapper.get('[data-test="permissions-v2-commit"]').trigger("click");
    const committed = await waitFor(() =>
      wrapper.get('[data-test="permissions-v2-staged-count"]').text().includes("0"),
    );
    expect(committed).toBe(true);

    await wrapper.get('[data-test^="permission-revoke-"]').trigger("click");
    const revoked = await waitFor(() =>
      wrapper.get('[data-test="permissions-v2-staged-count"]').text().includes("1"),
    );
    expect(revoked).toBe(true);

    await wrapper.get('[data-test="permissions-v2-discard"]').trigger("click");
    await waitFor(() =>
      wrapper.get('[data-test="permissions-v2-staged-count"]').text().includes("0"),
    );
    expect(wrapper.text()).toContain("member:7");
    expect(wrapper.get('[data-test="permissions-v2-staged-count"]').text()).toContain("0");
  });
});
