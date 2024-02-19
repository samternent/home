<script setup>
import { shallowRef, watchEffect, watch, computed } from "vue";
import { useLedger } from "@/module/ledger/useLedger";

import { SButton } from "ternent-ui/components";

const props = defineProps({
  table: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["submit"]);

const { ledger, getCollection, addItem, getCollections } = useLedger();
const tableName = shallowRef(props.table);

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
</script>
<template>
  <input
    placeholder="Table name"
    v-model="tableName"
    :disabled="Boolean(itemTypes?.length)"
  />
  <table
    class="text-left table-auto w-full whitespace-nowrap border-separate text-sm"
  >
    <thead class="sticky top-[0.2em] bg-base-200">
      <th
        class="uppercase p-2 z-10 bg-base-300 border-base-200 border font-thin"
      >
        name
      </th>
      <th
        class="uppercase p-2 z-10 bg-base-300 border-base-200 border font-thin"
      >
        type
      </th>
      <th
        class="uppercase p-2 z-10 bg-base-300 border-base-200 border font-thin"
      >
        required
      </th>
    </thead>
    <tbody class="">
      <template v-for="item in []" :key="item.id">
        <tr tabindex="0" class="h-12 border-base-300 border-b border-l">
          <td class="border-r border-base-300 border-b truncate w-20"></td>
          <td class="border-r border-base-300 border-b"></td>
          <td class="border-r border-base-300 border-b"></td>
        </tr>
      </template>
      <tr @keyup.enter="addListItem" class="sticky bottom-0 bg-base-100">
        <td></td>
        <td class="">
          <div>
            select type
            <!-- <VSelect
          @change="updateItem($event, itemType.data?.name)"
          :items="getItems(itemType.data.type, itemType.data.name)"
          class="w-64"
          density="comfortable"
          variant="outlined"
          theme="dark"
          :value="
            getValue(
              itemType.data.type,
              itemType.data.name,
              newItem[itemType.data.name]
            )
          "
          rounded
          :hide-details="true"
          placeholder="Select"
          :menu-props="{
            closeOnContentClick: true,
          }"
        >
          <template #selection="{ item: { raw: item } }">
            <div class="flex items-center">item</div>
          </template>

          <template #item="{ item: { raw: item } }">
            <VSheet>
              <VListItem
                density="compact"
                @click="updateItem($event, itemType.data?.name, item)"
              >
                {{ item[itemType.data?.name.split(":")[1]] }}
              </VListItem></VSheet
            >
          </template>
        </VSelect> -->
          </div>
        </td>
        <td></td>

        <td colspan="3" class="p-2">
          <div class="flex justify-end items-center">
            <SButton
              class="w-full max-w-32"
              variant="tonal"
              @click="addListItem"
              color="success"
            >
              Add
            </SButton>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
