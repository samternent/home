<script setup lang="ts">
import { onMounted, watch, shallowRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import {
  useLedger,
  LedgerDataTable,
  LedgerCreateTableDrawer,
  LedgerHeader,
  LedgerCreateLedger,
} from "@/modules/ledger";

import {
  AppShellControlPanelMini,
  AppShellControlPanel,
} from "@/modules/appShell";

const tables = shallowRef<Array<Object>>([]);
const table = useLocalStorage("concords/ledger/table", "");

const showEditTable = shallowRef(false);

const { ledger, getCollections } = useLedger();

watch(
  ledger,
  async (_ledger: Object) => {
    tables.value = [
      { title: "USERS", value: "users" },
      { title: "PERMISSIONS", value: "permissions" },
      ...Object.keys(getCollections())
        .filter((col) => col.includes(":types"))
        .map((col) => ({
          title: col.split(":types")[0].toUpperCase(),
          value: col.split(":types")[0],
        })),
    ];
    if (!table.value) {
      table.value = tables.value[0]?.value;
    }
  },
  { immediate: true }
);
</script>
<template>
  <div class="w-full flex-1 flex flex-col">
    <Teleport to="#TopFixedPanel">
      <LedgerHeader v-model:table="table" :tables="tables" v-if="ledger" />
    </Teleport>
    <LedgerCreateLedger v-if="!ledger" />
    <div v-else class="flex flex-1 overflow-auto">
      <VProgressCircular
        color="primary"
        indeterminate
        :size="64"
        v-if="!table"
      />

      <LedgerDataTable :table="table" @edit="showEditTable = true" />

      <LedgerCreateTableDrawer
        v-model="showEditTable"
        :table="table"
        :key="table"
      />
    </div>
    <Teleport to="#BottomPanelBanner">
      <AppShellControlPanelMini />
    </Teleport>
    <Teleport to="#BottomPanelContent">
      <AppShellControlPanel />
    </Teleport>
  </div>
</template>
