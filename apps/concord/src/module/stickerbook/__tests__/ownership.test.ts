import { describe, expect, it } from "vitest";
import { resolveOwnership } from "../ownership";

describe("resolveOwnership", () => {
  it("defaults ownership to pack owner", () => {
    const records = [{ stickerId: "s1" }];
    const ownership = resolveOwnership({
      records,
      transferEntries: [],
      defaultOwnerByStickerId: new Map([["s1", "ownerA"]]),
      currentKey: "ownerA",
    });

    const entry = ownership.get("s1");
    expect(entry?.owner).toBe("ownerA");
    expect(entry?.status).toBe("owned");
  });

  it("marks received when last transfer not authored by current", () => {
    const records = [{ stickerId: "s1" }];
    const ownership = resolveOwnership({
      records,
      transferEntries: [
        {
          entryId: "t1",
          author: "ownerA",
          data: { stickerId: "s1", toPublicKey: "ownerB", prevTransferHash: null },
        },
        {
          entryId: "t2",
          author: "ownerA",
          data: { stickerId: "s1", toPublicKey: "ownerC", prevTransferHash: "t1" },
        },
        {
          entryId: "t3",
          author: "ownerB",
          data: { stickerId: "s1", toPublicKey: "ownerB", prevTransferHash: "t2" },
        },
      ],
      defaultOwnerByStickerId: new Map([["s1", "ownerA"]]),
      currentKey: "ownerB",
    });

    const entry = ownership.get("s1");
    expect(entry?.owner).toBe("ownerB");
    expect(entry?.status).toBe("received");
  });

  it("marks sent when current authored transfer away", () => {
    const records = [{ stickerId: "s1" }];
    const ownership = resolveOwnership({
      records,
      transferEntries: [
        {
          entryId: "t1",
          author: "ownerA",
          data: { stickerId: "s1", toPublicKey: "ownerB", prevTransferHash: null },
        },
      ],
      defaultOwnerByStickerId: new Map([["s1", "ownerA"]]),
      currentKey: "ownerA",
    });

    const entry = ownership.get("s1");
    expect(entry?.owner).toBe("ownerB");
    expect(entry?.status).toBe("sent");
  });

  it("flags conflicts when multiple transfers share a prev hash", () => {
    const records = [{ stickerId: "s1" }];
    const ownership = resolveOwnership({
      records,
      transferEntries: [
        {
          entryId: "t1",
          author: "ownerA",
          data: { stickerId: "s1", toPublicKey: "ownerB", prevTransferHash: null },
        },
        {
          entryId: "t2",
          author: "ownerA",
          data: { stickerId: "s1", toPublicKey: "ownerC", prevTransferHash: null },
        },
      ],
      defaultOwnerByStickerId: new Map([["s1", "ownerA"]]),
      currentKey: "ownerA",
    });

    const entry = ownership.get("s1");
    expect(entry?.conflict).toBe(true);
    expect(entry?.status).toBe("conflicted");
  });
});
