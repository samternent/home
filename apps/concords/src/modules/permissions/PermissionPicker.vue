<script lang="ts" setup>
import { NText, NIcon, NSpace, NSelect } from "naive-ui";
import { LockOpen } from "@vicons/ionicons5";
import { IdentityAvatar } from "@/modules/identity";

import { shallowRef, watch, computed, h } from "vue";
import { useLedger } from "@/modules/ledger";
import type { IRecord } from "@concords/proof-of-work";

defineProps({
  modelValue: String,
});
defineEmits(["update:modelValue"]);

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

const permissionTypes = computed(() => {
  return [
    {
      type: "group",
      label: "Permissions",
      key: "permissions",
      children: [
        ...new Set(
          permissions.value?.map(({ data }) => ({
            label: data?.title,
            value: data?.title,
            description: "Permission",
          })) || []
        ),
      ],
    },
    {
      type: "group",
      label: "Users",
      key: "users",
      children: [
        ...new Set(
          users.value?.map(({ data }) => ({
            label: data?.username,
            value: data?.identity,
            description: "User",
          })) || []
        ),
      ],
    },
  ];
});

function renderSingleSelectTag({ option }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
      },
    },
    [
      option.description === "User" &&
        h(IdentityAvatar, {
          identity: option.value,
          round: true,
          size: "xs",
          class: "mr-2",
        }),
      option.description === "Permission" &&
        h(NIcon, {
          component: LockOpen,
          size: 16,
          class: "mr-2",
        }),
      option.label as string,
    ].filter(Boolean)
  );
}

function renderLabel(option) {
  return h(
    "div",
    {
      class: "flex items-center",
    },
    [
      // Replace with permission icon
      option.description === "User" &&
        h(IdentityAvatar, {
          identity: option.value,
          round: true,
          size: "sm",
        }),
      option.description === "Permission" &&
        h(NIcon, {
          component: LockOpen,
          size: 24,
          color: "white",
        }),
      h(
        "div",
        {
          style: {
            marginLeft: "12px",
            padding: "4px 0",
          },
        },
        [
          h("div", null, [option.label as string]),
          h(
            NText,
            { depth: 3, tag: "div" },
            {
              default: () => option.description,
            }
          ),
        ].filter(Boolean)
      ),
    ]
  );
}
</script>
<template>
  <NSpace vertical>
    <NSelect
      :options="permissionTypes"
      :render-label="renderLabel"
      :render-tag="renderSingleSelectTag"
      @update:value="(val) => $emit('update:modelValue', val)"
    >
      <template #action> If you click this demo, you may need it. </template>
    </NSelect>
  </NSpace>
</template>
