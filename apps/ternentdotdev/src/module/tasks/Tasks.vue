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
  <div
    class="text-base flex flex-col flex-1 w-full font-thin absolute top-0 bottom-0"
  >
    <div class="flex items-center justify-between px-2">
      <SBrandHeader size="md" class="font-light">{{ collection }}</SBrandHeader>
      <SButton @click="addTaskItem" type="ghost" class="my-2 btn-sm"
        >Add item</SButton
      >
    </div>
    <div
      class="h-[0.2em] sticky-0 absolute top-[2.8em] z-10 w-full bg-base-100"
    />
    <div class="w-full absolute top-[2.8em] overflow-auto flex-1 bottom-0">
      <LedgerDataTable :table="collection" />
    </div>
  </div>
</template>
