<script setup lang="ts">
import { shallowRef, computed } from "vue";
import { LedgerCreateTableDrawer } from "@/modules/ledger";

const props = defineProps({
  table: {
    type: String,
    default: null,
  },
  tables: {
    type: Array,
    default: null,
  },
});

const emit = defineEmits(["update:table"]);

const table = computed({
  get() {
    return props.table;
  },
  set(value) {
    emit("update:table", value);
  },
});
const showCreateTable = shallowRef(false);
</script>
<template>
  <div class="flex justify-between items-center w-full">
    <div class="md:mx-2 flex">
      <VSelect
        variant="solo"
        v-model="table"
        :items="tables"
        density="compact"
        theme="dark"
        rounded
        :hide-details="true"
      >
      </VSelect>
      <button @click="showCreateTable = true" variant="outlined" class="ml-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </div>

    <LedgerCreateTableDrawer
      v-model="showCreateTable"
      @submit="(e: string) => (table = e)"
    />
  </div>
</template>
