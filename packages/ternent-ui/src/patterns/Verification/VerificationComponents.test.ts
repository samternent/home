import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../primitives/Accordion/Accordion.vue", () => ({
  default: defineComponent({
    name: "AccordionStub",
    setup(_, { slots, attrs }) {
      return () => h("div", { ...attrs, "data-stub": "accordion" }, slots.default?.());
    },
  }),
}));

vi.mock("../../primitives/Accordion/AccordionItem.vue", () => ({
  default: defineComponent({
    name: "AccordionItemStub",
    props: {
      title: {
        type: String,
        default: "",
      },
    },
    setup(props, { slots, attrs }) {
      return () =>
        h("section", { ...attrs, "data-stub": "accordion-item" }, [
          h("button", { type: "button" }, props.title),
          slots.default?.(),
        ]);
    },
  }),
}));

vi.mock("../../primitives/Badge/Badge.vue", () => ({
  default: defineComponent({
    name: "BadgeStub",
    setup(_, { slots, attrs }) {
      return () => h("span", { ...attrs, "data-stub": "badge" }, slots.default?.());
    },
  }),
}));

vi.mock("../../primitives/Button/Button.vue", () => ({
  default: defineComponent({
    name: "ButtonStub",
    setup(_, { slots, attrs }) {
      return () => h("button", attrs, slots.default?.());
    },
  }),
}));

vi.mock("../../primitives/Card/Card.vue", () => ({
  default: defineComponent({
    name: "CardStub",
    setup(_, { slots, attrs }) {
      return () => h("section", { ...attrs, "data-stub": "card" }, slots.default?.());
    },
  }),
}));

vi.mock("../../primitives/Separator/Separator.vue", () => ({
  default: defineComponent({
    name: "SeparatorStub",
    setup(_, { attrs }) {
      return () => h("hr", { ...attrs, "data-stub": "separator" });
    },
  }),
}));

vi.mock("../PreviewPanel/PreviewPanel.vue", () => ({
  default: defineComponent({
    name: "PreviewPanelStub",
    props: {
      code: {
        type: String,
        default: "",
      },
      title: {
        type: String,
        default: "",
      },
    },
    setup(props, { attrs }) {
      return () =>
        h("pre", { ...attrs, "data-stub": "preview-panel" }, `${props.title}\n${props.code}`);
    },
  }),
}));

import VerificationBadge from "./VerificationBadge.vue";
import VerificationSummary from "./VerificationSummary.vue";
import VerificationDetailsPanel from "./VerificationDetailsPanel.vue";

describe("verification components", () => {
  it("renders badge label, context, and truncated subject", () => {
    const wrapper = mount(VerificationBadge, {
      props: {
        status: "verified",
        context: { surface: "browser" },
        subject: "dist-manifest.json",
      },
    });

    expect(wrapper.text()).toContain("Verified");
    expect(wrapper.text()).toContain("Browser");
    expect(wrapper.text()).toContain("dist-manifest.json");
  });

  it("renders summary copy actions", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    const wrapper = mount(VerificationSummary, {
      props: {
        status: "verified",
        subject: "dist-manifest.json",
        hash: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        signer: "signer-key-id-1234567890",
        algorithm: "ECDSA-P256-SHA256",
        timestamp: "2026-03-14T00:00:00.000Z",
        version: "seal/v1",
      },
    });

    expect(wrapper.text()).toContain("Proof summary");
    expect(wrapper.find('[aria-label*="Copy hash"]').exists()).toBe(true);
    expect(wrapper.find('[aria-label*="Copy signer"]').exists()).toBe(true);
    expect(wrapper.find('[data-status="verified"]').exists()).toBe(true);
  });

  it("renders details panel raw proof accordion and compact variant", () => {
    const wrapper = mount(VerificationDetailsPanel, {
      props: {
        status: "verified",
        subject: "dist-manifest.json",
        hash: "sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        signer: "signer-key-id-1234567890",
        algorithm: "ECDSA-P256-SHA256",
        timestamp: "2026-03-14T00:00:00.000Z",
        version: "seal/v1",
        signature: "abcdefg123456",
        rawProof: "{\"type\":\"seal-proof\"}",
        variant: "compact",
      },
    });

    expect(wrapper.attributes("data-variant")).toBe("compact");
    expect(wrapper.text()).toContain("View raw proof");
    expect(wrapper.find('[aria-label*="Copy hash"]').exists()).toBe(true);
  });
});
