import loki from "lokijs";
import { decrypt } from "@concords/encrypt";
import { formatEncryptionFile, stripIdentityKey } from "@concords/utils";
import type { ILedger, IRecord } from "@concords/proof-of-work";

export default function useLokiPlugin(
  name = "ledger",
  myPublicIdentity: string,
  myPrivateEncryption: string
) {
  let collection: Collection<any>;
  const collections: {
    [key: string]: Collection<any>;
  } = {};

  function createCollection({ ledger }: { ledger: ILedger }): void {
    collection = db.addCollection(ledger.id, { disableMeta: true });
    collections.users = db.addCollection("users", {
      disableMeta: true,
    });
  }

  const db = new loki(`${name}.db`);

  return {
    db,
    getCollection: (col: string) => collections[col] || collection,
    plugin: {
      onLoad: createCollection,
      async onAdd(record: IRecord) {
        if (!record.data && !record.encrypted) return;
        if (record.data?.permission) {
          const permission = collections.permissions.findOne({
            "data.title": record.data.permission,
            "data.identity": stripIdentityKey(myPublicIdentity),
          })?.data;

          if (!permission) {
            console.error(`'${record.data.permission}' permission not found`);
          } else {
            try {
              const decrypted = await decrypt(
                myPrivateEncryption,
                formatEncryptionFile(permission.secret)
              );
              record.data = JSON.parse(
                await decrypt(
                  decrypted,
                  formatEncryptionFile(record.data.encrypted)
                )
              );
            } catch (e) {
              console.error(e);
              return;
            }
          }
        }

        if (record.collection && !collections[record.collection]) {
          collections[record.collection] = db.addCollection(record.collection, {
            disableMeta: true,
          });
        }

        // const user = collections.users.findOne({ identity: record.identity });
        // if (!user) {
        //   collections.users.insert({ identity: record.identity });
        // }

        const col = !record.collection
          ? collection
          : collections[record.collection];

        const item = col.findOne({ "data.id": record.data?.id });

        if (item) {
          col.update({ ...item, ...record });
        } else {
          col.insert(record);
        }
      },
    },
  };
}
