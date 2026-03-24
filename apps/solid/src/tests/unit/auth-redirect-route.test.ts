import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteAuthRedirect from "@/routes/auth/RouteAuthRedirect.vue";

const completeRedirect = vi.fn(async () => undefined);
const replace = vi.fn(async () => undefined);

vi.mock("@/modules/solid-session", () => ({
  useSolidSession: () => ({
    error: {
      value: null,
    },
    completeRedirect,
  }),
}));

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRouter: () => ({
      replace,
    }),
  };
});

describe("RouteAuthRedirect", () => {
  beforeEach(() => {
    completeRedirect.mockClear();
    replace.mockClear();
  });

  it("completes the redirect and sends the user to /app", async () => {
    mount(RouteAuthRedirect);
    await flushPromises();

    expect(completeRedirect).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/app");
  });
});
