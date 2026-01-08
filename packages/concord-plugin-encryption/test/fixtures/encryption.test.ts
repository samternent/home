import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  replayEncryption,
  findWrapsForPrincipal,
  EncryptionRegistryError,
} from "../../src";

function loadFixture(name: string) {
  const url = new URL(`./${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

describe("encryption registry replay", () => {
  test("validates epoch increments", () => {
    const ledger = loadFixture("epoch-validation.json");
    try {
      replayEncryption(ledger, undefined, {
        permissionsConfig: { rootAdmins: ["did:root"] },
      });
      throw new Error("Expected replayEncryption to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(EncryptionRegistryError);
      expect((error as EncryptionRegistryError).code).toBe("INVALID_EPOCH");
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
});
