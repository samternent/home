<script lang="ts" setup>
import { IdentityAvatar } from "@/modules/identity";

import { shallowRef, watch, computed, h } from "vue";
import { useLedger, useLedgerAppShell } from "@/modules/ledger";
import type { IRecord } from "concords-proof-of-work";

defineProps({
  modelValue: String,
});
const emit = defineEmits(["update:modelValue"]);

const { showPermissionsPanel } = useLedgerAppShell();
const { ledger, getCollection } = useLedger();
const permissions = shallowRef<Array<IRecord>>([]);
const users = shallowRef<Array<IRecord>>([]);

const selected = shallowRef<any>(null);

watch(
  ledger,
  () => {
    permissions.value = getCollection("permissions")?.data;
    users.value = getCollection("users")?.data;
  },
  { immediate: true }
);

const items = computed(() => {
  return [
    {
      type: "group",
      label: "Permissions",
      key: "permissions",
      children: [...new Set(permissions.value?.map(({ data }) => data))],
    },
    {
      type: "group",
      label: "Users",
      key: "users",
      children: [...new Set(users.value?.map(({ data }) => data))],
    },
  ];
});

function onSelect(val) {
  emit("update:modelValue", val?.title ? val.title : val?.identity);
  selected.value = val;
}
</script>
<template>
  <div>
    <VSelect
      v-model="selected"
      :items="items"
      class="w-64"
      density="comfortable"
      variant="outlined"
      theme="dark"
      rounded
      :hide-details="true"
      placeholder="Select permission"
      :menu-props="{
        closeOnContentClick: true,
      }"
    >
      <template v-slot:selection="{ item: { raw: item } }">
        <div class="flex items-center">
          <IdentityAvatar
            :identity="item.identity"
            size="xs"
            class="mr-2"
            v-if="item.username"
          />
          <svg
            v-if="item.title"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4 mr-2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <span v-if="item.title">{{ item.title }}</span>
          <span v-if="item.username">{{ item.username }}</span>
        </div>
      </template>

      <template #item="{ item: { raw: item } }">
        <VSheet>
          <div class="p-2 font-medium">{{ item.label }}</div>
          <VListItem
            @click="onSelect(child)"
            v-for="child in item.children"
            :key="child.id"
            density="compact"
          >
            <template #prepend v-if="item.key === 'users'">
              <IdentityAvatar
                :identity="child.identity"
                size="xs"
                class="mr-2"
              />
            </template>
            <template #prepend v-if="item.key === 'permissions'">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4 mr-2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </template>
            <span v-if="item.key === 'permissions'">{{ child.title }}</span>
            <span v-if="item.key === 'users'">{{ child.username }}</span>
          </VListItem>
        </VSheet>
      </template>
    </VSelect>
  </div>
</template>
