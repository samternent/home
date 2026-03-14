import { describe, expect, it } from "vitest";
import {
  getVerificationBadgeTone,
  getVerificationContextSubtext,
  getVerificationHeadline,
  getVerificationStatusLabel,
  truncateMiddle,
} from "./verification.utils";

describe("verification utils", () => {
  it("maps status labels and tones", () => {
    expect(getVerificationStatusLabel("verified")).toBe("Verified");
    expect(getVerificationStatusLabel("failed")).toBe("Failed");
    expect(getVerificationStatusLabel("unknown")).toBe("Unknown");

    expect(getVerificationHeadline("verified")).toBe("Verified proof");
    expect(getVerificationHeadline("failed")).toBe("Failed proof");
    expect(getVerificationHeadline("unknown")).toBe("Unknown proof");

    expect(getVerificationBadgeTone("verified")).toBe("success");
    expect(getVerificationBadgeTone("failed")).toBe("critical");
    expect(getVerificationBadgeTone("unknown")).toBe("neutral");
  });

  it("derives context subtext and truncates long values", () => {
    expect(
      getVerificationContextSubtext("verified", { surface: "browser" })
    ).toBe("Verified in browser");
    expect(
      getVerificationContextSubtext("failed", { surface: "cli" })
    ).toBe("Verification failed via CLI");
    expect(getVerificationContextSubtext("unknown", { surface: "ci" })).toBeUndefined();

    expect(truncateMiddle("abcdef")).toBe("abcdef");
    expect(truncateMiddle("abcdefghijklmnopqrstuvwxyz", 4, 4)).toBe(
      "abcd...wxyz"
    );
  });
});

