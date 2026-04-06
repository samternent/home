import { ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppShell from "@/modules/ui/components/AppShell.vue";

const routeMeta = ref<Record<string, unknown>>({});
const terminalOpen = ref(false);

vi.mock("vue-router", () => ({
  useRoute: () => ({
    meta: routeMeta.value,
  }),
}));

vi.mock("@/modules/ui/useAppShellState", () => ({
  useAppShellState: () => ({
    terminalOpen,
  }),
}));

vi.mock("@/modules/ui/components/AppShellTopBar.vue", () => ({
  default: {
    template: '<div data-test="top-bar" />',
  },
}));

vi.mock("@/modules/ui/components/AppShellBottomNav.vue", () => ({
  default: {
    template: '<div data-test="bottom-nav" />',
  },
}));

vi.mock("@/modules/ui/components/AppShellIdentityBanner.vue", () => ({
  default: {
    template: '<div data-test="identity-banner" />',
  },
}));

vi.mock("@/modules/ui/components/AppShellConnectPanel.vue", () => ({
  default: {
    template: '<div data-test="connect-panel" />',
  },
}));

vi.mock("@/modules/ui/components/AppShellExplorerOverlay.vue", () => ({
  default: {
    template: '<div data-test="explorer-overlay" />',
  },
}));

vi.mock("@/modules/ui/components/AppShellAddDialog.vue", () => ({
  default: {
    template: '<div data-test="add-dialog" />',
  },
}));

vi.mock("@/modules/ui/components/RunTerminalDock.vue", () => ({
  default: {
    template: '<div data-test="terminal-dock" />',
  },
}));

describe("AppShell", () => {
  beforeEach(() => {
    routeMeta.value = {};
    terminalOpen.value = false;
  });

  it("renders the standard shell chrome outside focused routes", () => {
    terminalOpen.value = true;

    const wrapper = mount(AppShell, {
      slots: {
        default: '<div data-test="shell-slot" />',
      },
    });

    expect(wrapper.find('[data-test="top-bar"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="identity-banner"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="bottom-nav"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="terminal-dock"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="connect-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="shell-slot"]').exists()).toBe(true);
  });

  it("hides shell chrome in focused mode while keeping overlays and outlet", () => {
    routeMeta.value = {
      shellMode: "focus",
    };
    terminalOpen.value = true;

    const wrapper = mount(AppShell, {
      slots: {
        default: '<div data-test="shell-slot" />',
      },
    });

    expect(wrapper.find('[data-test="top-bar"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="identity-banner"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="bottom-nav"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="terminal-dock"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="connect-panel"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="explorer-overlay"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="add-dialog"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="shell-slot"]').exists()).toBe(true);
  });
});
