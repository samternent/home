import { stripIdentityKey } from "ternent-utils";

export type TransferEntry = {
  entryId: string;
  author: string;
  data: {
    stickerId: string;
    toPublicKey: string;
    prevTransferHash: string | null;
  };
};

export type StickerRecord = {
  stickerId: string;
};

export function resolveOwnership(params: {
  records: StickerRecord[];
  transferEntries: TransferEntry[];
  defaultOwnerByStickerId: Map<string, string>;
  currentKey: string;
}) {
  const normalizeKey = (key: string) => {
    if (!key) return "";
    return stripIdentityKey(key);
  };
  const currentKey = normalizeKey(params.currentKey);

  const bySticker = new Map<string, TransferEntry[]>();
  for (const transfer of params.transferEntries) {
    const stickerId = transfer.data?.stickerId;
    if (!stickerId) continue;
    const list = bySticker.get(stickerId) || [];
    list.push({
      ...transfer,
      author: normalizeKey(transfer.author),
      data: {
        ...transfer.data,
        toPublicKey: normalizeKey(transfer.data?.toPublicKey || ""),
      },
    });
    bySticker.set(stickerId, list);
  }

  const result = new Map<string, any>();
  for (const record of params.records) {
    const stickerId = record.stickerId;
    const transfersForSticker = bySticker.get(stickerId) || [];
    const prevMap = new Map<string | null, TransferEntry[]>();
    for (const transfer of transfersForSticker) {
      const prev = transfer.data?.prevTransferHash ?? null;
      const list = prevMap.get(prev) || [];
      list.push(transfer);
      prevMap.set(prev, list);
    }

    let conflict = false;
    for (const list of prevMap.values()) {
      if (list.length > 1) {
        conflict = true;
        break;
      }
    }

    const defaultOwner =
      normalizeKey(params.defaultOwnerByStickerId.get(stickerId) || "") ||
      currentKey;
    let owner = defaultOwner;
    let lastTransfer: TransferEntry | null = null;

    if (!conflict && transfersForSticker.length) {
      if (!prevMap.has(null)) {
        conflict = true;
      } else {
        const visited = new Set<string | null>();
        let cursor: string | null = null;
        while (prevMap.has(cursor)) {
          if (visited.has(cursor)) {
            conflict = true;
            break;
          }
          visited.add(cursor);
          const next = prevMap.get(cursor)?.[0];
          if (!next) break;
          lastTransfer = next;
          owner = next.data.toPublicKey;
          cursor = next.entryId;
        }
      }
    }

    let status = "unowned";
    if (conflict) {
      status = "conflicted";
    } else if (owner && owner === currentKey) {
      status =
        lastTransfer && lastTransfer.author !== currentKey
          ? "received"
          : "owned";
    } else if (
      owner &&
      owner !== currentKey &&
      transfersForSticker.some((transfer) => transfer.author === currentKey)
    ) {
      status = "sent";
    }

    result.set(stickerId, {
      stickerId,
      owner,
      status,
      conflict,
      lastTransfer,
      record,
    });
  }

  return result;
}
