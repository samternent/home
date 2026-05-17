import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import { createMemoryHistory, createRouter } from "vue-router";
import { toDidKeyFromPublicKey } from "@/app/plugins/identityKey";
import RoutePermissions from "@/routes/app/RoutePermissions.vue";
import { DEFAULT_CONCORD_STORAGE_KEY, DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY } from "@/app/runtime";
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

function createPermissionsRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/s/permissions/:permissionKey?",
        component: RoutePermissions,
      },
      {
        path: "/s/users",
        component: {
          template: "<div>Users</div>",
        },
      },
    ],
  });
}

describe("RoutePermissions", () => {
  beforeEach(async () => {
    await resetAppApiSingletonForTests();
    configureAppApiSingletonForTests({
      identity: await createIdentity("2026-04-20T10:00:00.000Z"),
    });
    localStorage.removeItem(DEFAULT_CONCORD_STORAGE_KEY);
    localStorage.removeItem(DEFAULT_ENCRYPTED_IDENTITY_STORAGE_KEY);
  });

  it("auto-selects first permission and uses projection-backed add/revoke", async () => {
    const router = createPermissionsRouter();
    await router.push("/s/permissions");
    await router.isReady();

    const wrapper = mount(RoutePermissions, {
      global: {
        plugins: [router],
      },
    });

    const ready = await waitFor(() =>
      wrapper.get('[data-test="permissions-v2-status"]').text().includes("ready"),
    );
    expect(ready).toBe(true);

    await wrapper.get('[data-test="permission-create-title"]').setValue("Reviewers");
    await wrapper.get('[data-test="permission-create-form"]').trigger("submit");

    const selected = await waitFor(
      () =>
        typeof router.currentRoute.value.params.permissionKey === "string" &&
        router.currentRoute.value.path.startsWith("/s/permissions/"),
    );
    expect(selected).toBe(true);

    const actor = await useAppApi().identity.ensureActiveIdentity();
    const permissionRecord = useAppApi().permissions.all().at(0);
    expect(permissionRecord).toBeTruthy();
    const permissionId = permissionRecord!.id;
    expect(wrapper.get(`[data-test="permission-key-state-${permissionId}"]`).text()).toContain(
      "key ready",
    );
    expect(
      wrapper
        .get(`[data-test="permission-member-glyph-${permissionId}-${actor.identityKey}"]`)
        .attributes("data-glyph-fallback"),
    ).toBe("false");

    const appApi = useAppApi();
    const memberIdentity = await createIdentity("2026-04-21T10:00:00.000Z");
    const memberIdentityKey = toDidKeyFromPublicKey(memberIdentity.publicKey);
    await appApi.users.create({
      identityKey: memberIdentityKey,
    });

    const addVisible = await waitFor(() =>
      wrapper.find(`[data-test^="permission-grant-submit-${permissionId}-"]`).exists(),
    );
    expect(addVisible).toBe(true);
    expect(wrapper.find(`[data-test^="permission-grant-glyph-${permissionId}-"]`).exists()).toBe(
      true,
    );

    await wrapper
      .get(`[data-test="permission-grant-submit-${permissionId}-${memberIdentityKey}"]`)
      .trigger("click");

    const granted = await waitFor(() =>
      wrapper.find(`[data-test="permission-member-${permissionId}-${memberIdentityKey}"]`).exists(),
    );
    expect(granted).toBe(true);
    expect(
      wrapper
        .find(`[data-test="permission-member-glyph-${permissionId}-${memberIdentityKey}"]`)
        .exists(),
    ).toBe(true);

    await wrapper
      .get(`[data-test="permission-revoke-${permissionId}-${memberIdentityKey}"]`)
      .trigger("click");

    const revoked = await waitFor(
      () =>
        wrapper
          .find(`[data-test="permission-member-${permissionId}-${memberIdentityKey}"]`)
          .exists() === false,
    );
    expect(revoked).toBe(true);

    expect(wrapper.find('[data-test^="permission-grant-member-id-"]').exists()).toBe(false);
    expect(wrapper.find('[data-test^="permission-grant-member-label-"]').exists()).toBe(false);
  });

  it("does not offer the creator identity as assignable after permission create", async () => {
    const router = createPermissionsRouter();
    await router.push("/s/permissions");
    await router.isReady();

    const wrapper = mount(RoutePermissions, {
      global: {
        plugins: [router],
      },
    });

    await waitFor(() =>
      wrapper.get('[data-test="permissions-v2-status"]').text().includes("ready"),
    );

    await wrapper.get('[data-test="permission-create-title"]').setValue("Auditors");
    await wrapper.get('[data-test="permission-create-form"]').trigger("submit");

    const assignableEmpty = await waitFor(() =>
      wrapper.find('[data-test="permission-assignable-empty"]').exists(),
    );
    expect(assignableEmpty).toBe(true);
    expect(wrapper.find('[data-test="permissions-users-empty"]').exists()).toBe(false);
  });
});
