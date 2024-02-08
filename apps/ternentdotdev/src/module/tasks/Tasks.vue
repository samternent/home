<script setup>
import { useLedger } from "@/module/ledger/useLedger";
import { useIdentity } from "@/module/identity/useIdentity";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

import { SButton } from "ternent-ui/components";

const { publicKeyPEM, privateKeyPEM } = useIdentity();

const { ledger, addItem, getCollection } = useLedger();

function addTaskItem() {
  addItem(
    {
      name: "task name",
      completed: false,
    },
    "tasks"
  );
}
</script>
<template>
  <div>
    <IdentityAvatar :identity="publicKeyPEM" size="md" class="mr-4" />
    <SButton @click="addTaskItem">Add item</SButton>
    <pre>{{ JSON.stringify(ledger, null, 2, 2) }}</pre>
  </div>
</template>
