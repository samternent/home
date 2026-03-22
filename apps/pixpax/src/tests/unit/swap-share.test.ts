import { describe, expect, it } from "vitest";
import {
  createSwapRecipientPayload,
  isSwapRecipientPayload,
  parseSwapRecipientPayload,
} from "@/modules/swaps/swap-share";

describe("swap share payloads", () => {
  it("round-trips a recipient public key through QR payload format", () => {
    const publicKey = "age1examplepublickey123";
    const payload = createSwapRecipientPayload(publicKey);

    expect(isSwapRecipientPayload(payload)).toBe(true);
    expect(parseSwapRecipientPayload(payload)).toBe(publicKey);
  });

  it("accepts a raw public key as a fallback input", () => {
    const publicKey = "age1examplepublickey123";

    expect(isSwapRecipientPayload(publicKey)).toBe(false);
    expect(parseSwapRecipientPayload(publicKey)).toBe(publicKey);
  });
});
