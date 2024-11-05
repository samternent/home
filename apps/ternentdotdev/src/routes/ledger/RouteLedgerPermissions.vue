<script setup>
import { computed, shallowRef } from "vue";
import { SBrandHeader, SButton } from "ternent-ui/components";
import { useBreadcrumbs } from "../../module/breadcrumbs/useBreadcrumbs";
import { useLedger } from "../../module/ledger/useLedger";

useBreadcrumbs({
  path: "/ledger/permissions",
  name: "Permissions",
});

const { getCollection } = useLedger();

const permissions = getCollection("permissions")?.data;
</script>
<template>
  <div class="p-2 max-w-4xl"></div>
</template>
