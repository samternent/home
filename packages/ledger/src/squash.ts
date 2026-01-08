import type { Entry } from "@ternent/concord-protocol";
import {
  deriveEntryId,
  getEntrySigningPayload,
} from "@ternent/concord-protocol";

import type { PendingEntry } from "./ledger";

type PayloadObject = Record<string, any>;

function isPayloadObject(payload: unknown): payload is PayloadObject {
  return !!payload && typeof payload === "object" && !Array.isArray(payload);
}

function payloadId(payload: PayloadObject): string | null {
  return typeof payload.id === "string" ? payload.id : null;
}

export type SquashByIdAndKindOpts = {
  kinds?: string[]; // allowlist; if omitted, squash all kinds
  now?: () => string;

  // required for re-sign
  signingKey: CryptoKey;
  publicKey: CryptoKey;
  resolveAuthor: (publicKey: CryptoKey) => Promise<string> | string;
  sign: (
    signingKey: CryptoKey,
    signingPayload: ReturnType<typeof getEntrySigningPayload>
  ) => Promise<string> | string;

  /**
   * If true, keep non-(kind+id) entries as-is; if false, drop them.
   * For apps: keep them.
   */
  passthroughUnkeyed?: boolean;
};

export async function squashByIdAndKindAndResign(
  pending: PendingEntry[],
  opts: SquashByIdAndKindOpts
): Promise<PendingEntry[]> {
  const now = opts.now ?? (() => new Date().toISOString());
  const allow = opts.kinds?.length ? new Set(opts.kinds) : null;

  // group key => merged payload + template entry
  const buckets = new Map<
    string,
    { kind: string; id: string; merged: PayloadObject; template: Entry }
  >();

  const passthrough: PendingEntry[] = [];

  for (const p of pending) {
    const e = p.entry;
    if (!e.kind) {
      if (opts.passthroughUnkeyed ?? true) passthrough.push(p);
      continue;
    }
    if (allow && !allow.has(e.kind)) {
      passthrough.push(p);
      continue;
    }
    if (!isPayloadObject(e.payload)) {
      passthrough.push(p);
      continue;
    }

    const id = payloadId(e.payload);
    if (!id) {
      passthrough.push(p);
      continue;
    }

    const key = `${e.kind}::${id}`;
    const prev = buckets.get(key);

    if (!prev) {
      buckets.set(key, {
        kind: e.kind,
        id,
        merged: { ...e.payload },
        template: e,
      });
    } else {
      // later wins
      prev.merged = { ...prev.merged, ...e.payload };
    }
  }

  const author = await opts.resolveAuthor(opts.publicKey);
  const rewritten: PendingEntry[] = [];

  for (const b of buckets.values()) {
    // rewritten entry = new timestamp, merged payload, new signature
    const core: Entry = {
      kind: b.kind,
      timestamp: now(),
      author,
      payload: b.merged,
      signature: null,
    };

    const signature = await opts.sign(
      opts.signingKey,
      getEntrySigningPayload(core)
    );

    const signed: Entry = { ...core, signature };
    const entryId = await deriveEntryId(signed);

    rewritten.push({ entryId, entry: signed });
  }

  // determinism: sort rewritten by key (optional but nice)
  rewritten.sort((a, b) => {
    const ap = a.entry.payload as any;
    const bp = b.entry.payload as any;
    return `${a.entry.kind}::${ap?.id}`.localeCompare(
      `${b.entry.kind}::${bp?.id}`
    );
  });

  return [...passthrough, ...rewritten];
}
