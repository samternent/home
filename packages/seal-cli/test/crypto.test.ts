import { describe, expect, it } from "vitest";
import { parseIdentity } from "@ternent/identity";
import {
  createSealIdentity,
  createSealMnemonicIdentity,
  exportIdentityJson,
} from "../src";

describe("seal crypto", () => {
  it("creates and serializes a seal identity", async () => {
    const identity = await createSealIdentity("2026-03-17T00:00:00.000Z");
    const exported = exportIdentityJson(identity);

    expect(identity.format).toBe("ternent-identity");
    expect(identity.version).toBe("2");
    expect(parseIdentity(exported)).toEqual(identity);
  });

  it("creates a mnemonic-backed seal identity", async () => {
    const created = await createSealMnemonicIdentity({ words: 12 });

    expect(created.mnemonic.split(/\s+/).length).toBe(12);
    expect(created.identity.format).toBe("ternent-identity");
  });
});
