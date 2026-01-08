import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  replayEncryption,
  findWrapsForPrincipal,
  findWrap,
  explainDecryptability,
  EncryptionRegistryError,
} from "../../src";

function loadFixture(name: string) {
  const url = new URL(`./${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

describe("encryption registry replay", () => {
  test("rejects skipped epochs", () => {
    const ledger = loadFixture("epoch-skip.json");
    try {
      replayEncryption(ledger, undefined, {
        permissionsConfig: { rootAdmins: ["did:root"] },
      });
      throw new Error("Expected replayEncryption to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(EncryptionRegistryError);
      expect((error as EncryptionRegistryError).code).toBe(
        "INVALID_EPOCH_TRANSITION"
      );
    }
  });

  test("rejects repeated epochs", () => {
    const ledger = loadFixture("epoch-repeat.json");
    try {
      replayEncryption(ledger, undefined, {
        permissionsConfig: { rootAdmins: ["did:root"] },
      });
      throw new Error("Expected replayEncryption to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(EncryptionRegistryError);
      expect((error as EncryptionRegistryError).code).toBe(
        "INVALID_EPOCH_TRANSITION"
      );
    }
  });

  test("discovers wraps from rotate and publish", () => {
    const ledger = loadFixture("wrap-discovery.json");
    const state = replayEncryption(ledger, undefined, {
      permissionsConfig: { rootAdmins: ["did:root"] },
    });

    const wraps = findWrapsForPrincipal(
      state,
      "did:alice",
      "projects:alpha",
      2
    );
    expect(wraps.length).toBe(2);
    expect(wraps[0].wrap.ct).toBe("wrap-ct");
    expect(wraps[1].wrap.ct).toBe("wrap-ct-2");

    const latest = findWrap(state, "did:alice", "projects:alpha", 2);
    expect(latest?.wrap.ct).toBe("wrap-ct-2");
  });

  test("revocation via omission removes new epoch access", () => {
    const ledger = loadFixture("omission-revocation.json");
    const state = replayEncryption(ledger, undefined, {
      permissionsConfig: { rootAdmins: ["did:root"] },
    });

    const wrapsEpoch2 = findWrapsForPrincipal(
      state,
      "did:alice",
      "projects:alpha",
      2
    );
    const wrapsEpoch3 = findWrapsForPrincipal(
      state,
      "did:alice",
      "projects:alpha",
      3
    );

    expect(wrapsEpoch2.length).toBe(1);
    expect(wrapsEpoch3.length).toBe(0);
  });

  test("explains decryptability with stable reason codes", () => {
    const ledger = loadFixture("omission-revocation.json");
    const results = explainDecryptability(ledger, "did:alice", ["did:root"]);
    const alpha = results.find((result) => result.scope === "projects:alpha");

    expect(alpha).toBeDefined();
    expect(alpha?.reasons.includes("EPOCH_UNKNOWN")).toBe(true);
    expect(alpha?.hasRead).toBe(true);
    expect(alpha?.hasRecipient).toBe(true);
    expect(alpha?.hasWrap).toBe(false);
  });
});
