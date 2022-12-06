<script setup>
import { shallowRef, watch } from "vue";
import { useLedger } from "@/modules/ledger";

import { AddPermissionsDialog } from "@/modules/permissions";

const dialog = shallowRef(false);

function addPermission(data) {
  createPermission(data);
  dialog.value = false;
}

const permissions = shallowRef([]);

const { getCollection, ledger, createPermission } = useLedger();

watch(
  ledger,
  () => {
    permissions.value = [...(getCollection("permissions")?.data || [])];
  },
  { immediate: true }
);
</script>
<template>
  <VDialog v-model="dialog" transition="dialog-bottom-transition">
    <template v-slot:activator="{ props }">
      <VBtn v-bind="props" variant="flat" color="secondary"
        >Add Permission
      </VBtn>
    </template>

    <AddPermissionsDialog @close="dialog = false" @create="addPermission" />
  </VDialog>
  <VList density="compact">
    <VListItem v-for="permission in permissions" :key="permission.id">{{
      permission.data.title
    }}</VListItem>
  </VList>
</template>
