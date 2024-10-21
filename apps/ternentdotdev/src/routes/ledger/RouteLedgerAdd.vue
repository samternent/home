<script setup>
import { shallowRef, watchEffect, watch, computed } from "vue";
import { useLedger } from "@/module/ledger/useLedger";
import { SResizablePanels } from "ternent-ui/components";

const { ledger, getCollection, addItem, getCollections } = useLedger();
const tableName = shallowRef();

const type = shallowRef("text");
const collectionType = shallowRef();
const name = shallowRef("");
const collections = shallowRef([]);
const itemTypes = shallowRef([]);
const linkedTypes = shallowRef(null);
const permission = shallowRef(null);

async function addItemType() {
  const _name = type.value.includes(":types")
    ? type.value.replace(":types", `:${name.value}`)
    : name.value;
  await addItem(
    {
      name: _name,
      type: type.value,
    },
    `${tableName.value.toLowerCase()}:types`
  );

  name.value = "";
  emit("submit", tableName);
}
async function addItemTypePermission() {
  if (!permission.value) {
    return;
  }
  await addItem(
    {
      name: "permission",
      type: permission.value,
    },
    `${tableName.value.toLowerCase()}:types`
  );

  name.value = "";
}

watchEffect(() => {
  if (tableName.value) {
    try {
      itemTypes.value = getCollection(`${tableName.value}:types`)?.data;
      collections.value = getCollections();
    } catch (err) {}
  }

  if (type.value.includes(":type")) {
    linkedTypes.value = getCollection(type.value)?.data.map(
      ({ data }) => data.name
    );
  } else {
    linkedTypes.value = null;
  }
});

watch(
  ledger,
  () => {
    itemTypes.value = getCollection(`${tableName.value}:types`)?.data;
    collections.value = getCollections();
    linkedTypes.value = getCollection(type.value)?.data.map(
      ({ data }) => data.name
    );
  },
  { immediate: true }
);

const linkedCollections = computed(() => {
  return Object.keys(collections.value).filter((collection) => {
    return collection.includes(":types");
  });
});

const contentWidth = shallowRef(600);
const isContentSmall = computed(
  () =>
    (contentWidth.value < 600 || smallerThanMd.value) && windowWidth.value > 0
);
</script>
<template></template>
