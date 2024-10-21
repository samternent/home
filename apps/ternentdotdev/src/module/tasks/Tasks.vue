<script setup>
import { useLedger } from "@/module/ledger/useLedger";
import LedgerDataTable from "@/module/ledger/LedgerDataTable.vue";
import { SButton, SBrandHeader } from "ternent-ui/components";
import { watch, shallowRef } from "vue";

const props = defineProps({
  collection: {
    type: String,
    required: true,
  },
});
const { ledger, addItem, getCollection } = useLedger();
const items = shallowRef();

watch(
  ledger,
  () => {
    items.value = [...getCollection(props.collection).data];
  },
  { immediate: true }
);

function addTaskItem() {
  addItem(
    {
      name: "task name",
      completed: false,
    },
    props.collection
  );
}
</script>
<template>
  <div class="text-base flex flex-col flex-1 w-full font-thin">
    <div class="flex items-center justify-between p-2">
      <SBrandHeader size="md" class="font-light">{{ collection }}</SBrandHeader>
    </div>
    <div
      class="h-[0.2em] sticky-0 absolute top-[2.8em] z-10 w-full bg-base-100"
    />
    <div class="w-full overflow-auto flex-1 bottom-0">
      <LedgerDataTable :table="collection" />
    </div>
  </div>
</template>
