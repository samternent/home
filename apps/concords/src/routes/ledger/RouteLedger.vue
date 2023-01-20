<script lang="ts" setup>
import { Ledger } from "@/modules/ledger";
import RouteLedgerNavigation from "./RouteLedgerNavigation.vue";
</script>
<template>
  <Ledger>
    <RouteLedgerNavigation />
    <RouterView />
  </Ledger>
</template>
