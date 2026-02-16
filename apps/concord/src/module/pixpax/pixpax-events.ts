export type PixPaxEventType =
  | "collection.created"
  | "series.added"
  | "series.retired"
  | "card.added"
  | "pack.issued"
  | "pack.claimed"
  | "giftcode.created"
  | "giftcode.redeemed"
  | "pack.invalidated";

export type PixPaxEvent<TPayload extends object = Record<string, unknown>> = {
  eventId: string;
  type: PixPaxEventType;
  occurredAt: string;
  source: string;
  payload: TPayload;
};

export type PixPaxEventPayloadByType = {
  "collection.created": {
    collectionId: string;
    version: string;
    name?: string;
    gridSize?: number;
  };
  "series.added": {
    collectionId: string;
    version: string;
    seriesIds: string[];
    cardCount?: number;
  };
  "series.retired": {
    collectionId: string;
    version: string;
    seriesId: string;
    reason?: string;
  };
  "card.added": {
    collectionId: string;
    version: string;
    cardId: string;
    seriesId?: string | null;
  };
  "pack.issued": {
    packId: string;
    collectionId: string;
    collectionVersion: string;
    dropId: string;
    cardIds?: string[];
    issuedTo?: string;
    count?: number;
    packRoot: string;
    itemHashes?: string[];
    contentsCommitment?: string;
    issuerKeyId?: string | null;
    issuerAuthor?: string | null;
    issuerSignature?: string | null;
    entryTimestamp?: string;
    signedEntryPayload?: Record<string, unknown>;
    issuanceMode?: string;
    untracked?: boolean;
  };
  "pack.claimed": {
    packId: string;
    collectionId: string;
    collectionVersion: string;
    dropId: string;
    issuedTo: string;
    mode?: string;
  };
  "giftcode.created": {
    codeId: string;
    collectionId: string;
    version: string;
    dropId: string;
    count?: number;
    bindToUser?: boolean;
    issuedTo?: string | null;
  };
  "giftcode.redeemed": {
    codeId: string;
    packId: string;
    collectionId: string;
    version: string;
    issuedTo: string;
    dropId?: string;
  };
  "pack.invalidated": {
    packId: string;
    reason: string;
    invalidatedBy?: string;
  };
};
