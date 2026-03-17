import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import LivePublishedProofJson from "@/modules/proof/components/LivePublishedProofJson.vue";

vi.mock("@/modules/proof/deployed", () => ({
  verifyPublishedArtifacts: vi.fn(),
}));

import { verifyPublishedArtifacts } from "@/modules/proof/deployed";

describe("LivePublishedProofJson", () => {
  it("renders the live published proof and verified state", async () => {
    vi.mocked(verifyPublishedArtifacts).mockResolvedValueOnce({
      valid: true,
      proof: {
        version: "2",
        type: "seal-proof",
        algorithm: "Ed25519",
        createdAt: "2026-03-13T00:00:00.000Z",
        subject: {
          kind: "manifest",
          path: "dist-manifest.json",
          hash: "sha256:abc",
        },
        signer: {
          publicKey: "public-key",
          keyId: "key-id",
        },
        signature: "signature",
      },
      proofRaw:
        '{"version":"2","type":"seal-proof","subject":{"kind":"manifest","path":"dist-manifest.json","hash":"sha256:abc"}}',
      publicKeyArtifact: null,
      keyId: "key-id",
      algorithm: "Ed25519",
      subjectHash: "sha256:abc",
      errors: [],
    });

    const wrapper = mount(LivePublishedProofJson, {
      props: {
        baseUrl: "https://seal.ternent.dev",
      },
    });

    await Promise.resolve();
    await nextTick();
    await Promise.resolve();
    await nextTick();

    const text = wrapper.text();

    expect(verifyPublishedArtifacts).toHaveBeenCalledWith(
      fetch,
      "https://seal.ternent.dev",
    );
    expect(text).toContain("Proof verified");
    expect(text).toContain("dist-manifest.json");
    expect(text).toContain("The proof is self-describing and versioned.");
    expect(text).toContain(
      "Fetched from the current site and verified against the published artifact bytes.",
    );
  });
});
