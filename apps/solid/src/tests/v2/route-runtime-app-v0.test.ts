import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import RouteRuntimeApp from "@/routes/app/RouteRuntimeApp.vue";

async function waitFor(check: () => boolean): Promise<boolean> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    await flushPromises();
    if (check()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  return false;
}

function createRuntimeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/w/:appId/:surfaceId?",
        component: RouteRuntimeApp,
      },
      {
        path: "/launch",
        component: {
          template: "<div>Launch</div>",
        },
      },
    ],
  });
}

describe("RouteRuntimeApp", () => {
  it("normalizes app-only route for tasks to default surface", async () => {
    const router = createRuntimeRouter();
    await router.push("/w/tasks");
    await router.isReady();

    const wrapper = mount(RouteRuntimeApp, {
      global: {
        plugins: [router],
      },
    });

    const rendered = await waitFor(() => wrapper.find('[data-test="runtime-task-list-v1"]').exists());
    expect(rendered).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe("/w/tasks/list");
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("List");
    expect(wrapper.text()).toContain("Board");
  });

  it("renders known app+surface route", async () => {
    const router = createRuntimeRouter();
    await router.push("/w/tasks/list");
    await router.isReady();

    const wrapper = mount(RouteRuntimeApp, {
      global: {
        plugins: [router],
      },
    });

    const rendered = await waitFor(() => wrapper.find('[data-test="runtime-task-list-v1"]').exists());
    expect(rendered).toBe(true);
    expect(wrapper.find('[data-test="runtime-task-list-create-title"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="runtime-task-list-open-create"]').exists()).toBe(true);
  });

  it("renders unsupported state for unknown app", async () => {
    const router = createRuntimeRouter();
    await router.push("/w/unknown");
    await router.isReady();

    const wrapper = mount(RouteRuntimeApp, {
      global: {
        plugins: [router],
      },
    });

    const rendered = await waitFor(() =>
      wrapper.find('[data-test="runtime-app-unsupported-title"]').exists(),
    );
    expect(rendered).toBe(true);
    expect(
      wrapper.get('[data-test="runtime-app-unsupported-launch-link"]').attributes("href"),
    ).toBe("/launch");
  });

  it("keeps unsupported state for unknown surface on known app", async () => {
    const router = createRuntimeRouter();
    await router.push("/w/tasks/unknown");
    await router.isReady();

    const wrapper = mount(RouteRuntimeApp, {
      global: {
        plugins: [router],
      },
    });

    const rendered = await waitFor(() =>
      wrapper.find('[data-test="runtime-app-unsupported-title"]').exists(),
    );
    expect(rendered).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe("/w/tasks/unknown");
  });

  it("navigates between surfaces from top tabs", async () => {
    const router = createRuntimeRouter();
    await router.push("/w/tasks/list");
    await router.isReady();

    const wrapper = mount(RouteRuntimeApp, {
      global: {
        plugins: [router],
      },
    });

    const rendered = await waitFor(() => wrapper.find('[role="tablist"]').exists());
    expect(rendered).toBe(true);

    const boardTab = wrapper.findAll('[role="tab"]').find((tab) => tab.text().trim() === "Board");
    expect(boardTab).toBeTruthy();
    await boardTab!.trigger("click");

    const moved = await waitFor(() => router.currentRoute.value.fullPath === "/w/tasks/board");
    expect(moved).toBe(true);
    const boardRendered = await waitFor(() =>
      wrapper.find('[data-test="runtime-task-board-v1"]').exists(),
    );
    expect(boardRendered).toBe(true);
  });
});
