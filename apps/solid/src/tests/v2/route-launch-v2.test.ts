import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import RouteLaunch from "@/routes/app/RouteLaunch.vue";

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

function createLaunchRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/launch",
        component: RouteLaunch,
      },
      {
        path: "/app/:appId/:surfaceId?",
        component: {
          template: "<div>App</div>",
        },
      },
    ],
  });
}

describe("RouteLaunch", () => {
  it("shows registered runtime apps and links to them", async () => {
    const router = createLaunchRouter();
    await router.push("/launch");
    await router.isReady();

    const wrapper = mount(RouteLaunch, {
      global: {
        plugins: [router],
      },
    });

    const rendered = await waitFor(() =>
      wrapper.find('[data-test="launch-v2-app-tasks"]').exists(),
    );
    expect(rendered).toBe(true);

    const links = wrapper.findAll('[data-test^="launch-v2-app-link-"]');
    expect(links).toHaveLength(1);
    expect(wrapper.get('[data-test="launch-v2-app-link-tasks"]').attributes("href")).toBe(
      "/app/tasks",
    );
  });
});
