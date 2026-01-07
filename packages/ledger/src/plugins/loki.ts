import loki from "lokijs";
import { decrypt } from "ternent-encrypt";
import { formatEncryptionFile, stripIdentityKey } from "ternent-utils";
import type { Entry, RuntimeLedger } from "ternent-proof-of-work";

type PayloadObject = {
  [key: string]: any;
};

function isPayloadObject(payload: unknown): payload is PayloadObject {
  return !!payload && typeof payload === "object" && !Array.isArray(payload);
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

export default function useLokiPlugin(
  name = "ledger",
  myPublicIdentity: string,
  myPrivateEncryption: string
) {
  let collection: Collection<any>;
  const collections: {
    [key: string]: Collection<any>;
  } = {};

  function createCollection({ ledger }: { ledger: RuntimeLedger }): void {
    collection = db.addCollection(ledger.ledgerId, { disableMeta: true });
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
      async onAdd(entry: Entry) {
        if (!isPayloadObject(entry.payload)) return;

        if (entry.payload?.permission) {
          const permission = findPermission(
            entry.payload.permission,
            stripIdentityKey(myPublicIdentity)
          );

          const encryptedPayload = getEncryptedPayload(entry.payload);
          if (!encryptedPayload) return;

          if (!permission) {
            try {
              entry.payload = {
                ...entry.payload,
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
              entry.payload = {
                ...entry.payload,
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

        if (entry.kind && !collections[entry.kind]) {
          collections[entry.kind] = db.addCollection(entry.kind, {
            disableMeta: true,
          });
        }

        const col = !entry.kind ? collection : collections[entry.kind];

        const item = entry.payload?.id
          ? col.findOne({ "payload.id": entry.payload.id })
          : null;

        if (item) {
          col.update({ ...item, ...entry });
        } else {
          col.insert(entry);
        }
      },
    },
  };
}
