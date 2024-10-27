<script setup>
import { computed, shallowRef } from "vue";
import { SBrandHeader, SButton } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useLedger } from "../../module/ledger/useLedger";
import IdentityAvatar from "@/module/identity/IdentityAvatar.vue";

useBreadcrumbs({
  path: "/l/permissions",
  name: "Permissions",
});

const { getCollection } = useLedger();

const users = getCollection("users")?.data;
</script>
<template>
  <div class="p-2 max-w-4xl">
    <IdentityAvatar
      v-for="user in users"
      :key="user.id"
      :identity="user.identity"
    />
  </div>
</template>
