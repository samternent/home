import { computed } from "vue";
import { stripIdentityKey } from "ternent-utils";
import { useProfile } from "../profile/useProfile";
import { useLedger, useBridge } from "../ledger/useLedger";
import { useIdentity } from "../identity/useIdentity";

type PackReceivedPayload = {
  type: "pack.received";
  packId: string;
  issuerIssuePayload: Record<string, any>;
  issuerSignature: string;
  issuerKeyId: string;
};

type StickerTransferPayload = {
  type: "sticker.transfer";
  stickerId: string;
  toPublicKey: string;
  prevTransferHash: string | null;
  memo?: string;
};

export function useStickerbook() {
  const profile = useProfile();
  const ledger = useLedger();
  const bridge = useBridge();
  const identity = useIdentity();

  const packEntries = bridge.collections.useArray("pack.received");
  const transferEntries = bridge.collections.useArray("sticker.transfer");

  const profileId = computed(() => profile.profileId.value);
  const publicKey = computed(() => {
    const key = identity.publicKeyPEM.value || "";
    return key ? stripIdentityKey(key) : "";
  });

  const receivedPacks = computed(() =>
    packEntries.value.map((entry: any) => ({
      entryId: entry.entryId,
      author: entry.author,
      data: entry.payload || entry.data || {},
    }))
  );

  const transfers = computed(() =>
    transferEntries.value.map((entry: any) => ({
      entryId: entry.entryId,
      author: entry.author,
      timestamp: entry.timestamp,
      data: entry.payload || entry.data || {},
    }))
  );

  async function recordPackReceived(payload: PackReceivedPayload) {
    await ledger.api.addAndStage({
      kind: "pack.received",
      payload,
      silent: true,
    });
  }

  async function recordTransfer(payload: StickerTransferPayload) {
    return ledger.api.addAndStage({
      kind: "sticker.transfer",
      payload,
      silent: true,
    });
  }

  async function recordPackAndCommit(payload: PackReceivedPayload) {
    const ledgerApi = ledger.api.api;
    const priorPending = ledgerApi?.getState()?.pending ?? [];

    try {
      await recordPackReceived(payload);
      await ledger.api.commit("stickerbook: pack received", {
        type: "stickerbook",
      });
    } catch (error) {
      if (ledgerApi?.replacePending) {
        await ledgerApi.replacePending(priorPending);
      }
      throw error;
    }
  }

  return {
    profileId,
    publicKey,
    receivedPacks,
    transfers,
    recordPackAndCommit,
    recordTransfer,
    migrateStickerOwnedToTransfers: async () => {
      const legacy = bridge.collections.snapshot("sticker.owned") as any[];
      if (!legacy.length) return { migrated: 0 };
      const bySticker = new Map<string, any[]>();
      for (const entry of legacy) {
        const data = entry.payload || entry.data;
        if (!data?.stickerId) continue;
        const list = bySticker.get(data.stickerId) || [];
        list.push({ ...entry, data });
        bySticker.set(data.stickerId, list);
      }

      let migrated = 0;
      for (const [stickerId, list] of bySticker.entries()) {
        const ordered = list.sort((a, b) =>
          String(a.timestamp || "").localeCompare(String(b.timestamp || ""))
        );
        let prevHash: string | null = null;
        for (const entry of ordered) {
          const toPublicKey = entry.author || publicKey.value || "";
          const created = await recordTransfer({
            type: "sticker.transfer",
            stickerId,
            toPublicKey,
            prevTransferHash: prevHash,
            memo: "migration",
          });
          prevHash = created?.entryId ?? null;
          migrated += 1;
        }
      }

      await ledger.api.commit("stickerbook: migrate transfers", {
        type: "stickerbook",
      });
      return { migrated };
    },
  };
}

export function getPeriodId(date: Date) {
  const seconds = parseInt(
    import.meta.env.VITE_STICKERBOOK_PERIOD_SECONDS || "",
    10
  );
  if (Number.isFinite(seconds) && seconds > 0) {
    const bucket = Math.floor(date.getTime() / (seconds * 1000));
    return `dev-${bucket}`;
  }

  const year = date.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const days = Math.floor(
    (date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
  );
  const week = Math.ceil((days + start.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
