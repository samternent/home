import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  can,
  getEffectiveCaps,
  replayPermissions,
  PermissionRegistryError,
} from "../../src";

function loadFixture(name: string) {
  const url = new URL(`./${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

describe("permissions registry replay", () => {
  test("bootstrap admins have admin for all scopes", () => {
    const ledger = loadFixture("bootstrap-admin.json");
    const state = replayPermissions(ledger, undefined, {
      rootAdmins: ["did:root"],
    });

    const caps = getEffectiveCaps(state, "did:root", "projects:alpha");
    expect(caps.has("admin")).toBe(true);
    expect(can(state, "did:root", "perm:grant", "projects:alpha")).toBe(true);
  });

  test("delegation fails without grant capability", () => {
    const ledger = loadFixture("delegation-denied.json");
    try {
      replayPermissions(ledger);
      throw new Error("Expected replayPermissions to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(PermissionRegistryError);
      expect((error as PermissionRegistryError).code).toBe(
        "UNAUTHORIZED_GRANT"
      );
    }
  });

  test("revoke removes capability", () => {
    const ledger = loadFixture("revoke.json");
    const state = replayPermissions(ledger, undefined, {
      rootAdmins: ["did:root"],
    });

    const caps = getEffectiveCaps(state, "did:bob", "projects:alpha");
    expect(caps.has("read")).toBe(false);
  });

  test("group-based grants resolve to members", () => {
    const ledger = loadFixture("group-grant.json");
    const state = replayPermissions(ledger, undefined, {
      rootAdmins: ["did:root"],
    });

    const caps = getEffectiveCaps(state, "did:alice", "projects:alpha");
    expect(caps.has("read")).toBe(true);
  });

  test("grant and revoke ordering is respected", () => {
    const ledger = loadFixture("order-grant-revoke.json");
    const state = replayPermissions(ledger, undefined, {
      rootAdmins: ["did:root"],
    });

    const caps = getEffectiveCaps(state, "did:bob", "projects:alpha");
    expect(caps.has("read")).toBe(true);

    const revokedState = replayPermissions(ledger, "commit-2", {
      rootAdmins: ["did:root"],
    });
    const revokedCaps = getEffectiveCaps(
      revokedState,
      "did:bob",
      "projects:alpha"
    );
    expect(revokedCaps.has("read")).toBe(false);
  });

  test("group membership changes apply immediately", () => {
    const ledger = loadFixture("group-membership-timing.json");

    const beforeMember = replayPermissions(ledger, "commit-2", {
      rootAdmins: ["did:root"],
    });
    expect(
      getEffectiveCaps(beforeMember, "did:alice", "projects:alpha").has("read")
    ).toBe(false);

    const afterAdd = replayPermissions(ledger, "commit-3", {
      rootAdmins: ["did:root"],
    });
    expect(
      getEffectiveCaps(afterAdd, "did:alice", "projects:alpha").has("read")
    ).toBe(true);

    const afterRemove = replayPermissions(ledger, "commit-4", {
      rootAdmins: ["did:root"],
    });
    expect(
      getEffectiveCaps(afterRemove, "did:alice", "projects:alpha").has("read")
    ).toBe(false);

    const afterReAdd = replayPermissions(ledger, "commit-5", {
      rootAdmins: ["did:root"],
    });
    expect(
      getEffectiveCaps(afterReAdd, "did:alice", "projects:alpha").has("read")
    ).toBe(true);
  });

  test("expiry is ignored unless nowIso is provided", () => {
    const ledger = loadFixture("expiry.json");
    const state = replayPermissions(ledger, undefined, {
      rootAdmins: ["did:root"],
    });

    const deterministicCaps = getEffectiveCaps(
      state,
      "did:alice",
      "projects:alpha"
    );
    expect(deterministicCaps.has("read")).toBe(true);

    const operationalCaps = getEffectiveCaps(
      state,
      "did:alice",
      "projects:alpha",
      "2024-07-04T00:00:00.000Z"
    );
    expect(operationalCaps.has("read")).toBe(false);
  });

  test("grant authorization is checked before applying entry", () => {
    const ledger = loadFixture("self-grant-denied.json");
    try {
      replayPermissions(ledger);
      throw new Error("Expected replayPermissions to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(PermissionRegistryError);
      expect((error as PermissionRegistryError).code).toBe(
        "UNAUTHORIZED_GRANT"
      );
    }
  });
});
