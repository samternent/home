import loki from "lokijs";
import { decrypt } from "ternent-encrypt";
import { formatEncryptionFile, stripIdentityKey } from "ternent-utils";
import type { Entry, LedgerContainer } from "@ternent/concord-protocol";

type PayloadObject = {
  [key: string]: any;
};

function isPayloadObject(payload: unknown): payload is PayloadObject {
  return !!payload && typeof payload === "object" && !Array.isArray(payload);
}

function hasPermission(payload: PayloadObject): payload is PayloadObject & {
  permission: string;
} {
  return typeof payload.permission === "string";
}

function getEncryptedPayload(payload: PayloadObject): string | null {
  if (payload.enc === "age" && typeof payload.ct === "string") {
    return payload.ct;
  }
  if (typeof payload.encrypted === "string") {
    return payload.encrypted;
  }
  return null;
}

function getPayloadId(payload: PayloadObject): string | null {
  if ("id" in payload && typeof payload.id === "string") {
    return payload.id;
  }
  return null;
}

export default function useLokiPlugin(
  name = "ledger",
  myPublicIdentity: string,
  myPrivateEncryption: string
) {
  let collection: Collection<any>;
  const collections: {
    [key: string]: Collection<any>;
  } = {};

  function createCollection({ ledger }: { ledger: LedgerContainer }): void {
    const rootCollection = ledger.head || "ledger";
    collection = db.addCollection(rootCollection, { disableMeta: true });
    collections["concord/user/added"] = db.addCollection("concord/user/added", {
      disableMeta: true,
    });
  }

  const db = new loki(`${name}.db`);

  function deleteDatabase() {
    Object.keys(collections).forEach((collection) => {
      db.removeCollection(collection);
      delete collections[collection];
    });
  }

  function findPermission(
    permissionTitle: string,
    identity: string
  ): PayloadObject | undefined {
    const permCollections = Object.keys(collections)
      .filter((key) => key.startsWith("concord/perm/"))
      .map((key) => collections[key]);

    for (const permCollection of permCollections) {
      const record = permCollection?.findOne({
        "payload.title": permissionTitle,
        "payload.identity": identity,
      })?.payload;
      if (record) {
        return record;
      }
    }

    return undefined;
  }

  return {
    db,
    getCollection: (col: string) => collections[col] || collection,
    getCollections: () => collections,
    plugin: {
      onLoad: createCollection,
      onDestroy: deleteDatabase,
      async onAdd(record: Entry & { entryId?: string }) {
        if (!isPayloadObject(record.payload)) return;
        const payload = record.payload;

        if (hasPermission(payload)) {
          const permission = findPermission(
            payload.permission,
            stripIdentityKey(myPublicIdentity)
          );

          const encryptedPayload = getEncryptedPayload(payload);
          if (!encryptedPayload) return;

          if (!permission) {
            try {
              record.payload = {
                ...payload,
                ...JSON.parse(
                  await decrypt(
                    myPrivateEncryption,
                    formatEncryptionFile(encryptedPayload)
                  )
                ),
              };
            } catch (e) {
              return;
            }
          } else {
            try {
              const decrypted = await decrypt(
                myPrivateEncryption,
                formatEncryptionFile(permission.secret)
              );
              record.payload = {
                ...payload,
                ...JSON.parse(
                  await decrypt(
                    decrypted,
                    formatEncryptionFile(encryptedPayload)
                  )
                ),
              };
            } catch (e) {
              return;
            }
          }
        }

        if (record.kind && !collections[record.kind]) {
          collections[record.kind] = db.addCollection(record.kind, {
            disableMeta: true,
          });
        }

        const col = !record.kind ? collection : collections[record.kind];

        const payloadId = getPayloadId(payload);
        const item = payloadId ? col.findOne({ "payload.id": payloadId }) : null;

        if (item) {
          col.update({ ...item, ...record });
        } else {
          col.insert(record);
        }
      },
    },
  };
}
