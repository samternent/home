<script lang="ts" setup>
import { provideLedger } from "@/modules/ledger";

provideLedger();
</script>
<template>
  <RouterView />
</template>
