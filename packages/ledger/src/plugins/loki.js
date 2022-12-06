import loki from "lokijs";
import { decrypt } from "@concords/encrypt";

export default (name = "ledger", myKey) => {
  let collection;
  const collections = {};

  function createCollection({ ledger }) {
    collection = db.addCollection(ledger.id, { disableMeta: true });
    collections.users = db.addCollection("users", {
      disableMeta: true,
    });
  }

  const db = new loki(`${name}.db`);

  return {
    db,
    getCollection: (col) => collections[col] || collection,
    plugin: {
      onLoad: createCollection,
      async onAdd(record) {
        if (!record.data && !record.encrypted) return;
        if (record.data.permission) {
          const permission = collections.permissions.findOne({
            id: record.data.permission,
          })?.data;

          if (!permission) {
            console.error(`'${record.data.permission}' permission not found`);
          } else {
            try {
              const decrypted = await decrypt(myKey, permission.secret);
              record.data = JSON.parse(
                await decrypt(decrypted, record.data.encrypted)
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

        const user = collections.users.findOne({ identity: record.identity });
        if (!user) {
          collections.users.insert({ identity: record.identity });
        }

        const col = !record.collection
          ? collection
          : collections[record.collection];

        const item = col.findOne({ "data.id": record.data.id });

        if (item) {
          col.update({ ...item, ...record });
        } else {
          col.insert(record);
        }
      },
    },
  };
};
