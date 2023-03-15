<script lang="ts" setup>
import { shallowRef, watchEffect, watch, computed } from "vue";
import { useLedger } from "@/modules/ledger";
import { PermissionPicker } from "@/modules/permissions";
import type { IRecord } from "@concords/proof-of-work";
import inputTypes from "@/utils/inputTypes";

const props = defineProps({
  table: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["submit"]);

const { ledger, getCollection, addItem, getCollections } = useLedger();
const tableName = shallowRef<String>(props.table);

const type = shallowRef<string>("text");
const collectionType = shallowRef<string>();
const name = shallowRef<string>("");
const collections = shallowRef<Array<string>>([]);
const itemTypes = shallowRef<Array<IRecord>>([]);
const linkedTypes = shallowRef<null | Array<IRecord>>(null);
const permission = shallowRef<string | null>(null);

async function addItemType() {
  const _name = type.value.includes(":types")
    ? type.value.replace(":types", `:${name.value}`)
    : name.value;
  await addItem(
    {
      name: _name,
      type: type.value,
    },
    `${tableName.value}:types`
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
    `${tableName.value}:types`
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
</script>
<template>
  <VTextField
    placeholder="Table name"
    v-model="tableName"
    :disabled="Boolean(itemTypes?.length)"
  />
  <table class="text-left table-auto w-full whitespace-nowrap">
    <thead>
      <tr>
        <th class="uppercase p-2 font-light">name</th>
        <th class="uppercase p-2 font-light">type</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in itemTypes"
        :key="item.id"
        class="focus:outline-none h-16 border-y border-[#3c3c3c]"
      >
        <td class="p-2">
          {{ item?.data?.name }}
        </td>
        <td class="p-2">
          {{ item?.data?.type }}
        </td>
      </tr>
    </tbody>
  </table>
  <!-- Default permission
  <PermissionPicker v-model="permission" /> -->
  <div class="my-8 w-full">
    <div class="flex items-center justify-between px-2">
      <VSelect
        v-model="type"
        placeholder="Type"
        :items="[...linkedCollections, ...inputTypes]"
        density="compact"
        class="flex-1"
      />
      <VSelect
        v-if="linkedTypes"
        v-model="name"
        placeholder="Link table"
        :items="linkedTypes"
        density="compact"
        class="flex-1"
      />
      <VTextField
        v-else
        density="compact"
        type="text"
        v-model="name"
        placeholder="Name"
        class="mr-1"
      />
    </div>
    <div class="flex w-full justify-end px-2">
      <VBtn color="success" :disabled="!tableName" @click="addItemType"
        >Add Type</VBtn
      >
    </div>
  </div>
</template>
