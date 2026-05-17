import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import RouteUsers from "@/routes/app/RouteUsers.vue";
import { toDidKeyFromPublicKey } from "@/app/plugins/identityKey";
import {
  configureAppApiSingletonForTests,
  resetAppApiSingletonForTests,
  useAppApi,
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

describe("RouteUsers", () => {
  beforeEach(async () => {
    await resetAppApiSingletonForTests();
    configureAppApiSingletonForTests({
      identity: await createIdentity("2026-04-20T10:00:00.000Z"),
    });
  });

  it("creates users and stages self profile updates", async () => {
    const wrapper = mount(RouteUsers);
    const appApi = useAppApi();

    const identity = await appApi.identity.ensureActiveIdentity();

    const identityFile = new File(
      [JSON.stringify({ identityKey: identity.identityKey })],
      "identity.json",
      { type: "application/json" },
    );
    const fileInput = wrapper.get('[data-test="user-create-identity-file"] input[type="file"]');
    const inputElement = fileInput.element as HTMLInputElement;
    const files = [identityFile];
    Object.defineProperty(inputElement, "files", {
      configurable: true,
      value: files,
    });
    await fileInput.trigger("change");
    await wrapper.get('[data-test="user-create-form"]').trigger("submit");

    const userVisible = await waitFor(() => wrapper.findAll('[data-test^="user-row-"]').length > 0);
    expect(userVisible).toBe(true);
    expect(wrapper.findAll('[data-test^="user-row-glyph-"]').length).toBeGreaterThan(0);

    await wrapper.get(`[data-test="user-edit-open-${identity.identityKey}"]`).trigger("click");
    const editModalVisible = await waitFor(() =>
      wrapper.find('[data-test="user-edit-modal"]').exists(),
    );
    expect(editModalVisible).toBe(true);
    expect(wrapper.find('[data-test="user-detail-glyph"]').exists()).toBe(true);

    await wrapper.get('[data-test="profile-display-name"]').setValue("Sam");
    await wrapper.get('[data-test="profile-upsert-form"]').trigger("submit");

    const staged = await waitFor(() =>
      wrapper.find('[data-test="profile-upsert-success"]').exists(),
    );
    expect(staged).toBe(true);
  });

  it("shows self-only profile guard for non-owner users", async () => {
    const wrapper = mount(RouteUsers);
    const appApi = useAppApi();

    await appApi.identity.ensureActiveIdentity();

    const memberIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const memberIdentityKey = toDidKeyFromPublicKey(memberIdentity.publicKey);

    await appApi.users.create({
      identityKey: memberIdentityKey,
    });

    await waitFor(() => wrapper.findAll('[data-test^="user-row-"]').length > 0);

    await wrapper.get(`[data-test="user-edit-open-${memberIdentityKey}"]`).trigger("click");

    const disabledVisible = await waitFor(() =>
      wrapper.find('[data-test="profile-edit-disabled"]').exists(),
    );
    expect(disabledVisible).toBe(true);
    expect(
      (wrapper.get('[data-test="profile-upsert-submit"]').element as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
