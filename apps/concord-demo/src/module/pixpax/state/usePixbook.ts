import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { stripIdentityKey } from "ternent-utils";
import { type PublicProfile, useProfile } from "../../profile/useProfile";
import { useLedger, useBridge } from "../../ledger/useLedger";
import { useIdentity } from "../../identity/useIdentity";

type PackReceivedPayload = {
  type: "pack.received" | "pixpax.pack.received";
  packId: string;
  issuerIssuePayload: Record<string, any>;
  renderPayload?: {
    gridB64?: string;
    kitParts?: Record<string, any>[];
  };
  receiptRef?: {
    segmentKey?: string;
    segmentHash?: string;
  };
  issuerSignature?: string;
  issuerKeyId?: string;
};

type StickerTransferPayload = {
  type: "sticker.transfer" | "pixpax.card.transfer";
  stickerId: string;
  toPublicKey: string;
  prevTransferHash: string | null;
  memo?: string;
};

export const PIXPAX_PACK_RECEIVED_KIND = "pixpax.pack.received";
export const PIXPAX_CARD_TRANSFER_KIND = "pixpax.card.transfer";
export const PIXPAX_PACK_RECEIVED_LEGACY_KIND = "pack.received";
export const PIXPAX_CARD_TRANSFER_LEGACY_KIND = "sticker.transfer";

export function usePixbook() {
  const profile = useProfile();
  const ledger = useLedger();
  const bridge = useBridge();
  const identity = useIdentity();
  const pixbookReadOnly = useLocalStorage("pixpax/pixbook/readOnly", false);
  const viewedPixbookProfileJson = useLocalStorage("pixpax/pixbook/viewProfileJson", "");

  const viewedPixbookProfile = computed<PublicProfile | null>(() => {
    if (!viewedPixbookProfileJson.value) return null;
    try {
      return JSON.parse(viewedPixbookProfileJson.value) as PublicProfile;
    } catch {
      return null;
    }
  });

  const packEntries = bridge.collections.useArray(PIXPAX_PACK_RECEIVED_KIND);
  const legacyPackEntries = bridge.collections.useArray(PIXPAX_PACK_RECEIVED_LEGACY_KIND);
  const transferEntries = bridge.collections.useArray(PIXPAX_CARD_TRANSFER_KIND);
  const legacyTransferEntries = bridge.collections.useArray(PIXPAX_CARD_TRANSFER_LEGACY_KIND);

  const profileId = computed(() => {
    if (pixbookReadOnly.value && viewedPixbookProfile.value?.profileId) {
      return viewedPixbookProfile.value.profileId;
    }
    return profile.profileId.value;
  });

  const publicKey = computed(() => {
    const key = pixbookReadOnly.value
      ? viewedPixbookProfile.value?.identity?.publicKey || ""
      : identity.publicKeyPEM.value || "";
    return key ? stripIdentityKey(key) : "";
  });

  const receivedPacks = computed(() =>
    [...packEntries.value, ...legacyPackEntries.value]
      .map((entry: any) => ({
        entryId: entry.entryId,
        author: entry.author,
        timestamp: entry.timestamp,
        data: entry.payload || entry.data || {},
      }))
      .sort((a, b) => String(a.timestamp || "").localeCompare(String(b.timestamp || "")))
  );

  const transfers = computed(() =>
    [...transferEntries.value, ...legacyTransferEntries.value]
      .map((entry: any) => ({
        entryId: entry.entryId,
        author: entry.author,
        timestamp: entry.timestamp,
        data: entry.payload || entry.data || {},
      }))
      .sort((a, b) => String(a.timestamp || "").localeCompare(String(b.timestamp || "")))
  );

  async function recordPackReceived(payload: PackReceivedPayload) {
    if (pixbookReadOnly.value) {
      throw new Error("Pixbook is read-only.");
    }
    await ledger.api.addAndStage({
      kind: PIXPAX_PACK_RECEIVED_KIND,
      payload,
      silent: true,
    });
  }

  async function recordTransfer(payload: StickerTransferPayload) {
    if (pixbookReadOnly.value) {
      throw new Error("Pixbook is read-only.");
    }
    return ledger.api.addAndStage({
      kind: PIXPAX_CARD_TRANSFER_KIND,
      payload,
      silent: true,
    });
  }

  async function recordPackAndCommit(payload: PackReceivedPayload) {
    if (pixbookReadOnly.value) {
      throw new Error("Pixbook is read-only.");
    }
    const ledgerApi = ledger.api.api;
    const priorPending = ledgerApi?.getState()?.pending ?? [];

    try {
      await recordPackReceived(payload);
      await ledger.api.commit("pixpax: pack received", {
        type: "pixpax",
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
      if (pixbookReadOnly.value) {
        throw new Error("Pixbook is read-only.");
      }
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
            type: "pixpax.card.transfer",
            stickerId,
            toPublicKey,
            prevTransferHash: prevHash,
            memo: "migration",
          });
          prevHash = created?.entryId ?? null;
          migrated += 1;
        }
      }

      await ledger.api.commit("pixpax: migrate transfers", {
        type: "pixpax",
      });
      return { migrated };
    },
  };
}

export function getPixpaxPeriodId(date: Date) {
  const pixpaxSeconds = parseInt(import.meta.env.VITE_PIXPAX_PERIOD_SECONDS || "", 10);
  const legacySeconds = parseInt(import.meta.env.VITE_STICKERBOOK_PERIOD_SECONDS || "", 10);
  const effectiveSeconds =
    Number.isFinite(pixpaxSeconds) && pixpaxSeconds > 0 ? pixpaxSeconds : legacySeconds;

  if (Number.isFinite(effectiveSeconds) && effectiveSeconds > 0) {
    const bucket = Math.floor(date.getTime() / (effectiveSeconds * 1000));
    return `dev-${bucket}`;
  }

  const isoDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  isoDate.setUTCDate(isoDate.getUTCDate() + 4 - (isoDate.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(isoDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((isoDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${isoDate.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
