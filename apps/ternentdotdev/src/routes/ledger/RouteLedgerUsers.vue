<script setup>
import { computed, shallowRef } from "vue";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useLedger } from "../../module/ledger/useLedger";
import { useIdentity } from "../../module/identity/useIdentity";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

useBreadcrumbs({
  path: "/ledger/users",
  name: "Users",
});

const { getCollection } = useLedger();
const { publicKeyPEM } = useIdentity();

const users = getCollection("users")?.data;
</script>
<template>
  <div class="p-2 max-w-4xl">
    <div v-for="user in users" :key="user.id" class="flex items-center gap-2">
      <IdentityAvatar :identity="user.identity" />
      <div v-if="user.identity === publicKeyPEM">(You)</div>
    </div>
  </div>
</template>
