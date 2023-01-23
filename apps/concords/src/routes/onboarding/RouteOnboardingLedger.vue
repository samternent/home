<script setup lang="ts">
import JsonTreeView from "@/components/JsonTreeView.vue";
import { useLedger } from "@/modules/ledger";

const { ledger } = useLedger();
</script>
<template>
  <JsonTreeView :data="JSON.stringify(ledger)" :maxDepth="3" />
</template>
