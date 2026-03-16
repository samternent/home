import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import HeroProofArtifactCard from "@/modules/proof/components/HeroProofArtifactCard.vue";

vi.mock("@/modules/proof/deployed", () => ({
  verifyPublishedArtifacts: vi.fn(),
}));

import { verifyPublishedArtifacts } from "@/modules/proof/deployed";

describe("HeroProofArtifactCard", () => {
  it("renders live published proof state in the hero card", async () => {
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
          hash: "sha256:abc123",
        },
        signer: {
          publicKey: "public-key",
          keyId: "key-id-1234567890",
        },
        signature: "signature",
      },
      proofRaw:
        '{"version":"2","type":"seal-proof","algorithm":"Ed25519","subject":{"kind":"manifest","path":"dist-manifest.json","hash":"sha256:abc123"},"signer":{"keyId":"key-id-1234567890"}}',
      publicKeyArtifact: null,
      keyId: "key-id-1234567890",
      algorithm: "Ed25519",
      subjectHash: "sha256:abc123",
      errors: [],
    });

    const wrapper = mount(HeroProofArtifactCard, {
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
    expect(text).toContain("Live published proof");
    expect(text).toContain("Live proof verified");
    expect(text).toContain("dist-manifest.json");
    expect(text).toContain("Ed25519");
    expect(text).toContain("sha256:abc123");
    expect(
      wrapper.find('a[href="https://seal.ternent.dev/proof.json"]').text(),
    ).toContain("View proof.json");
  });
});
