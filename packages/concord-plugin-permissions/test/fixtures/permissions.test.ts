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
});
