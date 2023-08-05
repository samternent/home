import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "concords-proof-of-work";

export function useCollection(name: String) {
  if (!name) {
    return;
  }

  const { ledger, getCollection } = useLedger();

  const items = shallowRef<Array<IRecord>>([]);

  watch(
    ledger,
    () => {
      items.value = getCollection(name)?.data;
    },
    { immediate: true }
  );

  return { items };
}
