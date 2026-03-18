import { describe, expect, it } from "vitest";
import { createIdentity } from "@ternent/identity";
import { recipientFromIdentity } from "@ternent/armour";
import { deriveCommitId as deriveProtocolCommitId } from "@ternent/concord-protocol";
import {
  createLedger,
  type LedgerPersistenceSnapshot,
  type LedgerStorageAdapter
} from "../src/index.ts";

function createClock(values: string[]) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)];
}

function createMemoryStorage(): LedgerStorageAdapter & {
  snapshot: LedgerPersistenceSnapshot | null;
} {
  return {
    name: "memory",
    snapshot: null,
    async load() {
      return this.snapshot;
    },
    async save(snapshot) {
      this.snapshot = structuredClone(snapshot);
    },
    async clear() {
      this.snapshot = null;
    }
  };
}

describe("@ternent/ledger", () => {
  it("creates deterministic plain entry history across fresh instances", async () => {
    const identity = await createIdentity("2026-03-18T10:00:00.000Z");
    const createProjection = () => ({ ids: [] as string[] });

    const makeLedger = () =>
      createLedger({
        identity: {
          signer: { identity },
          authorResolver: () => "did:alice"
        },
        initialProjection: createProjection(),
        projector: (projection, entry) => ({
          ids: [...projection.ids, String((entry.payload as { data: { id: string } }).data.id)]
        }),
        now: createClock([
          "2026-03-18T10:00:00.000Z",
          "2026-03-18T10:00:01.000Z",
          "2026-03-18T10:00:02.000Z"
        ])
      });

    const ledgerA = await makeLedger();
    await ledgerA.create();
    await ledgerA.append({
      kind: "todo.item.created",
      payload: { id: "todo-1" }
    });
    const committedA = await ledgerA.commit();
    expect(await ledgerA.replay()).toEqual({ ids: ["todo-1"] });
    const exportedA = await ledgerA.export();

    const ledgerB = await makeLedger();
    await ledgerB.create();
    await ledgerB.append({
      kind: "todo.item.created",
      payload: { id: "todo-1" }
    });
    await ledgerB.commit();
    expect(await ledgerB.replay()).toEqual({ ids: ["todo-1"] });
    const exportedB = await ledgerB.export();

    expect(committedA.commit.seal.signature).toEqual(expect.any(String));
    expect(
      await deriveProtocolCommitId({
        parent: committedA.commit.parentCommitId,
        timestamp: committedA.commit.committedAt,
        metadata: committedA.commit.metadata,
        entries: committedA.commit.entryIds,
        signature: null
      })
    ).toBe(committedA.commit.commitId);
    expect(exportedB).toEqual(exportedA);
  });

  it("keeps staged entries out of committed history until an explicit commit and replays them last", async () => {
    const identity = await createIdentity("2026-03-18T10:03:00.000Z");
    const ledger = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:stage"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, String((entry.payload as { data: { id: string } }).data.id)],
      now: createClock([
        "2026-03-18T10:03:00.000Z",
        "2026-03-18T10:03:01.000Z",
        "2026-03-18T10:03:02.000Z",
        "2026-03-18T10:03:03.000Z",
        "2026-03-18T10:03:04.000Z"
      ])
    });

    await ledger.create();
    await ledger.append({
      kind: "todo.item.created",
      payload: { id: "committed-1" }
    });
    await ledger.commit();
    await ledger.append({
      kind: "todo.item.created",
      payload: { id: "staged-2" }
    });

    const exported = await ledger.export();
    expect(Object.keys(exported.entries)).toHaveLength(1);
    expect(ledger.getState().staged).toHaveLength(1);
    expect(await ledger.replay()).toEqual(["committed-1", "staged-2"]);
  });

  it("replays encrypted entries as encrypted or decrypted based on capability", async () => {
    const identity = await createIdentity("2026-03-18T10:05:00.000Z");
    const recipient = await recipientFromIdentity(identity);

    const makeLedger = (withDecryptor: boolean) =>
      createLedger({
        identity: {
          signer: { identity },
          authorResolver: () => "did:bob",
          decryptor: withDecryptor ? { identity } : undefined
        },
        initialProjection: [] as string[],
        projector: (projection, entry) => [
          ...projection,
          entry.payload.type === "decrypted"
            ? String((entry.payload as { data: { text: string } }).data.text)
            : entry.payload.type
        ],
        now: createClock([
          "2026-03-18T10:05:00.000Z",
          "2026-03-18T10:05:01.000Z",
          "2026-03-18T10:05:02.000Z"
        ])
      });

    const encryptedLedger = await makeLedger(false);
    await encryptedLedger.create();
    await encryptedLedger.append({
      kind: "journal.entry.created",
      payload: { text: "secret note" },
      protection: {
        type: "recipients",
        recipients: [recipient],
        encoding: "armor"
      }
    });
    await encryptedLedger.commit();

    expect(await encryptedLedger.replay()).toEqual(["encrypted"]);

    const decryptingLedger = await makeLedger(true);
    await decryptingLedger.import(await encryptedLedger.export());
    expect(await decryptingLedger.replay()).toEqual(["secret note"]);
  });

  it("verifies encrypted records deterministically even when ciphertext differs", async () => {
    const identity = await createIdentity("2026-03-18T10:10:00.000Z");
    const recipient = await recipientFromIdentity(identity);

    const makeLedger = () =>
      createLedger({
        identity: {
          signer: { identity },
          authorResolver: () => "did:carol",
          decryptor: { identity }
        },
        initialProjection: [] as string[],
        projector: (projection, entry) => [...projection, entry.entryId],
        now: createClock([
          "2026-03-18T10:10:00.000Z",
          "2026-03-18T10:10:01.000Z",
          "2026-03-18T10:10:02.000Z"
        ])
      });

    const ledgerA = await makeLedger();
    const ledgerB = await makeLedger();

    await ledgerA.create();
    await ledgerB.create();

    const entryA = await ledgerA.append({
      kind: "secret.created",
      payload: { text: "same secret" },
      protection: {
        type: "recipients",
        recipients: [recipient],
        encoding: "armor"
      }
    });
    const entryB = await ledgerB.append({
      kind: "secret.created",
      payload: { text: "same secret" },
      protection: {
        type: "recipients",
        recipients: [recipient],
        encoding: "armor"
      }
    });

    expect(entryA.entry.payload.type).toBe("encrypted");
    expect(entryB.entry.payload.type).toBe("encrypted");
    expect(entryA.entry.payload.data).not.toBe(entryB.entry.payload.data);

    await ledgerA.commit();
    await ledgerB.commit();

    expect((await ledgerA.verify()).valid).toBe(true);
    expect((await ledgerB.verify()).valid).toBe(true);
    expect(await ledgerA.replay()).toHaveLength(1);
    expect(await ledgerB.replay()).toHaveLength(1);
  });

  it("reports invalid ids for tampered commits and entries", async () => {
    const identity = await createIdentity("2026-03-18T10:15:00.000Z");
    const ledger = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:dana"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      },
      now: createClock([
        "2026-03-18T10:15:00.000Z",
        "2026-03-18T10:15:01.000Z",
        "2026-03-18T10:15:02.000Z"
      ])
    });

    await ledger.create();
    const appended = await ledger.append({
      kind: "todo.item.created",
      payload: { id: "todo-2" }
    });
    const committed = await ledger.commit();
    const container = await ledger.export();

    const tampered = structuredClone(container);
    tampered.commits[committed.commit.commitId] = {
      ...tampered.commits[committed.commit.commitId],
      parentCommitId: "missing-parent"
    };
    tampered.entries[appended.entry.entryId] = {
      ...tampered.entries[appended.entry.entryId],
      payload: {
        type: "plain",
        data: { id: "tampered" }
      }
    };

    const loaded = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:dana"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      }
    });
    await loaded.load(tampered);

    const verification = await loaded.verify();
    expect(verification.valid).toBe(false);
    expect(verification.committedHistoryValid).toBe(false);
    expect(verification.commitChainValid).toBe(false);
    expect(verification.commitProofsValid).toBe(false);
    expect(verification.entryProofsValid).toBe(false);
    expect(verification.invalidCommitIds).toContain(committed.commit.commitId);
    expect(verification.invalidEntryIds).toContain(appended.entry.entryId);
  });

  it("fails verification when committed entry order is tampered", async () => {
    const identity = await createIdentity("2026-03-18T10:16:00.000Z");
    const ledger = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:order"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      },
      now: createClock([
        "2026-03-18T10:16:00.000Z",
        "2026-03-18T10:16:01.000Z",
        "2026-03-18T10:16:02.000Z",
        "2026-03-18T10:16:03.000Z"
      ])
    });

    await ledger.create();
    await ledger.append({
      kind: "todo.item.created",
      payload: { id: "todo-ordered-1" }
    });
    await ledger.append({
      kind: "todo.item.created",
      payload: { id: "todo-ordered-2" }
    });
    const committed = await ledger.commit();

    const tampered = structuredClone(await ledger.export());
    tampered.commits[committed.commit.commitId] = {
      ...tampered.commits[committed.commit.commitId],
      entryIds: [...tampered.commits[committed.commit.commitId].entryIds].reverse()
    };

    const loaded = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:order"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      }
    });

    await loaded.load(tampered);
    const verification = await loaded.verify();

    expect(verification.valid).toBe(false);
    expect(verification.committedHistoryValid).toBe(false);
    expect(verification.commitChainValid).toBe(false);
    expect(verification.invalidCommitIds).toContain(committed.commit.commitId);
  });

  it("fails verification when a committed entry id is tampered", async () => {
    const identity = await createIdentity("2026-03-18T10:17:00.000Z");
    const ledger = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:entry-id"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      },
      now: createClock([
        "2026-03-18T10:17:00.000Z",
        "2026-03-18T10:17:01.000Z",
        "2026-03-18T10:17:02.000Z"
      ])
    });

    await ledger.create();
    const appended = await ledger.append({
      kind: "todo.item.created",
      payload: { id: "todo-entry-id" }
    });
    await ledger.commit();

    const tampered = structuredClone(await ledger.export());
    const tamperedEntry = {
      ...tampered.entries[appended.entry.entryId],
      entryId: "entry_tampered"
    };
    delete tampered.entries[appended.entry.entryId];
    tampered.entries.entry_tampered = tamperedEntry;

    const loaded = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:entry-id"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      }
    });

    await loaded.load(tampered);
    const verification = await loaded.verify();

    expect(verification.valid).toBe(false);
    expect(verification.committedHistoryValid).toBe(false);
    expect(verification.entriesValid).toBe(false);
    expect(verification.invalidEntryIds).toContain(appended.entry.entryId);
    expect(verification.invalidEntryIds).toContain("entry_tampered");
  });

  it("fails verification when an encrypted payload hash is tampered", async () => {
    const identity = await createIdentity("2026-03-18T10:17:30.000Z");
    const recipient = await recipientFromIdentity(identity);
    const ledger = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:payload-hash",
        decryptor: { identity }
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      },
      now: createClock([
        "2026-03-18T10:17:30.000Z",
        "2026-03-18T10:17:31.000Z",
        "2026-03-18T10:17:32.000Z"
      ])
    });

    await ledger.create();
    const appended = await ledger.append({
      kind: "secret.created",
      payload: { text: "hash me" },
      protection: {
        type: "recipients",
        recipients: [recipient],
        encoding: "armor"
      }
    });
    await ledger.commit();

    const tampered = structuredClone(await ledger.export());
    tampered.entries[appended.entry.entryId] = {
      ...tampered.entries[appended.entry.entryId],
      payload: {
        ...(tampered.entries[appended.entry.entryId].payload as {
          type: "encrypted";
          scheme: "age";
          mode: "recipients";
          encoding: "armor" | "binary";
          data: string;
          payloadHash: string;
        }),
        payloadHash: "sha256:tampered"
      }
    };

    const loaded = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:payload-hash",
        decryptor: { identity }
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      }
    });

    await loaded.load(tampered);
    const verification = await loaded.verify();

    expect(verification.valid).toBe(false);
    expect(verification.committedHistoryValid).toBe(false);
    expect(verification.payloadHashesValid).toBe(false);
    expect(verification.invalidEntryIds).toContain(appended.entry.entryId);
  });

  it("fails verification when commit proof material is tampered even if entry payloads remain intact", async () => {
    const identity = await createIdentity("2026-03-18T10:18:00.000Z");
    const ledger = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:proofs"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      },
      now: createClock([
        "2026-03-18T10:18:00.000Z",
        "2026-03-18T10:18:01.000Z",
        "2026-03-18T10:18:02.000Z"
      ])
    });

    await ledger.create();
    await ledger.append({
      kind: "todo.item.created",
      payload: { id: "todo-proof" }
    });
    const committed = await ledger.commit();

    const tampered = structuredClone(await ledger.export());
    tampered.commits[committed.commit.commitId] = {
      ...tampered.commits[committed.commit.commitId],
      seal: {
        ...tampered.commits[committed.commit.commitId].seal,
        signature: "tampered-signature"
      }
    };

    const loaded = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:proofs"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      }
    });

    await loaded.load(tampered);
    const verification = await loaded.verify();

    expect(verification.valid).toBe(false);
    expect(verification.committedHistoryValid).toBe(false);
    expect(verification.commitChainValid).toBe(true);
    expect(verification.commitProofsValid).toBe(false);
    expect(verification.invalidCommitIds).toContain(committed.commit.commitId);
  });

  it("treats later committed history as globally invalid when an earlier committed entry is corrupted", async () => {
    const identity = await createIdentity("2026-03-18T10:19:00.000Z");
    const ledger = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:cascade"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      },
      now: createClock([
        "2026-03-18T10:19:00.000Z",
        "2026-03-18T10:19:01.000Z",
        "2026-03-18T10:19:02.000Z",
        "2026-03-18T10:19:03.000Z",
        "2026-03-18T10:19:04.000Z"
      ])
    });

    await ledger.create();
    const first = await ledger.append({
      kind: "todo.item.created",
      payload: { id: "todo-cascade-1" }
    });
    await ledger.commit({
      metadata: {
        message: "first"
      }
    });
    await ledger.append({
      kind: "todo.item.created",
      payload: { id: "todo-cascade-2" }
    });
    await ledger.commit({
      metadata: {
        message: "second"
      }
    });

    const tampered = structuredClone(await ledger.export());
    tampered.entries[first.entry.entryId] = {
      ...tampered.entries[first.entry.entryId],
      payload: {
        type: "plain",
        data: { id: "tampered-cascade" }
      }
    };

    const loaded = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:cascade"
      },
      initialProjection: [] as string[],
      projector: (projection, entry) => [...projection, entry.entryId],
      replayPolicy: {
        verify: false
      }
    });

    await loaded.load(tampered);
    const verification = await loaded.verify();

    expect(verification.valid).toBe(false);
    expect(verification.committedHistoryValid).toBe(false);
    await expect(loaded.replay({ verify: true })).rejects.toThrow(
      "Ledger verification failed."
    );
  });

  it("round trips persistence without storing projection", async () => {
    const identity = await createIdentity("2026-03-18T10:20:00.000Z");
    const storage = createMemoryStorage();

    const ledger = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:erin"
      },
      initialProjection: { ids: [] as string[] },
      projector: (projection, entry) => ({
        ids: [...projection.ids, entry.entryId]
      }),
      storage,
      now: createClock([
        "2026-03-18T10:20:00.000Z",
        "2026-03-18T10:20:01.000Z",
        "2026-03-18T10:20:02.000Z"
      ])
    });

    await ledger.create();
    const staged = await ledger.append({
      kind: "todo.item.created",
      payload: { id: "persisted" }
    });
    await ledger.commit();

    expect(storage.snapshot).not.toBeNull();
    expect(storage.snapshot).not.toHaveProperty("projection");
    expect(storage.snapshot?.staged).toEqual([]);

    const restored = await createLedger({
      identity: {
        signer: { identity },
        authorResolver: () => "did:erin"
      },
      initialProjection: { ids: [] as string[] },
      projector: (projection, entry) => ({
        ids: [...projection.ids, entry.entryId]
      }),
      storage
    });

    expect(await restored.loadFromStorage()).toBe(true);
    expect(restored.getState()).not.toHaveProperty("signingKey");
    expect(restored.getState().projection.ids).toEqual([staged.entry.entryId]);
  });
});
