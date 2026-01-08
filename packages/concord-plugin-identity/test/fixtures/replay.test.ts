import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  getPrincipal,
  replayIdentity,
  resolveAgeRecipients,
  resolveCurrentAgeRecipient,
  IdentityRegistryError,
} from "../../src";

function loadFixture(name: string) {
  const url = new URL(`./${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

describe("identity registry replay", () => {
  test("replays basic identity upsert", () => {
    const ledger = loadFixture("basic-upsert.json");

    const state = replayIdentity(ledger);
    const principal = getPrincipal(state, "did:alice");

    expect(principal).toBeDefined();
    expect(principal?.displayName).toBe("Alice");
    expect(principal?.updatedAt).toBe("2024-04-02T01:00:00.000Z");
    expect(principal?.updatedBy).toBe("did:alice");
    expect(resolveAgeRecipients(state, "did:alice")).toEqual(["age1alice"]);
    expect(resolveCurrentAgeRecipient(state, "did:alice")).toBe("age1alice");
  });

  test("overwrites identity upsert in commit order", () => {
    const ledger = loadFixture("overwrite-upsert.json");

    const state = replayIdentity(ledger);
    const principal = getPrincipal(state, "did:alice");

    expect(principal).toBeDefined();
    expect(principal?.displayName).toBe("Alice Updated");
    expect(principal?.updatedAt).toBe("2024-05-03T01:00:00.000Z");
    expect(principal?.updatedBy).toBe("did:alice");
    expect(resolveAgeRecipients(state, "did:alice")).toEqual([
      "age1alice-rotated",
    ]);
    expect(resolveCurrentAgeRecipient(state, "did:alice")).toBe(
      "age1alice-rotated"
    );

    const earlierState = replayIdentity(ledger, "commit-1");
    const earlier = getPrincipal(earlierState, "did:alice");
    expect(earlier?.displayName).toBe("Alice");
    expect(earlier?.updatedAt).toBe("2024-05-02T01:00:00.000Z");
  });

  test("rejects identity.upsert with author mismatch", () => {
    const ledger = loadFixture("invalid-author.json");
    try {
      replayIdentity(ledger);
      throw new Error("Expected replayIdentity to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityRegistryError);
      expect((error as IdentityRegistryError).code).toBe("AUTHOR_MISMATCH");
    }
  });

  test("rejects empty age recipients", () => {
    const ledger = loadFixture("invalid-age-recipient.json");
    try {
      replayIdentity(ledger);
      throw new Error("Expected replayIdentity to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityRegistryError);
      expect((error as IdentityRegistryError).code).toBe(
        "INVALID_IDENTITY_UPSERT"
      );
    }
  });

  test("rejects missing principalId", () => {
    const ledger = loadFixture("missing-principal.json");
    try {
      replayIdentity(ledger);
      throw new Error("Expected replayIdentity to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityRegistryError);
      expect((error as IdentityRegistryError).code).toBe(
        "INVALID_IDENTITY_UPSERT"
      );
    }
  });

  test("rejects empty principalId", () => {
    const ledger = loadFixture("empty-principal.json");
    try {
      replayIdentity(ledger);
      throw new Error("Expected replayIdentity to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityRegistryError);
      expect((error as IdentityRegistryError).code).toBe(
        "INVALID_IDENTITY_UPSERT"
      );
    }
  });

  test("rejects invalid age recipient types", () => {
    const ledger = loadFixture("invalid-age-recipient-type.json");
    try {
      replayIdentity(ledger);
      throw new Error("Expected replayIdentity to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(IdentityRegistryError);
      expect((error as IdentityRegistryError).code).toBe(
        "INVALID_IDENTITY_UPSERT"
      );
    }
  });

  test("preserves age recipient ordering", () => {
    const ledger = loadFixture("multi-recipient-order.json");

    const state = replayIdentity(ledger);

    expect(resolveAgeRecipients(state, "did:alice")).toEqual([
      "age1-first",
      "age1-second",
      "age1-third",
    ]);
    expect(resolveCurrentAgeRecipient(state, "did:alice")).toBe("age1-first");
  });
});
