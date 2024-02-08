<script setup>
import { computed, shallowRef } from "vue";
import { SBrandHeader, SButton } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useLedger } from "../../module/ledger/useLedger";

useBreadcrumbs({
  path: "/apps/permissions",
  name: "Permissions",
});

const { getCollection } = useLedger();

const permissions = getCollection("permissions")?.data;
</script>
<template>
  <div class="p-2 max-w-4xl">
    <SBrandHeader class="font-light mb-4">Permissions</SBrandHeader>
    {{ permissions }}
  </div>
</template>
