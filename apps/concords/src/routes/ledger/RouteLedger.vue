<script lang="ts" setup>
import { provideLedger } from "@/modules/ledger";

provideLedger();
</script>
<template>
  <div>
    <RouterLink to="/l/">Ledger</RouterLink>
    <RouterLink to="/l/permissions">Permissions</RouterLink>
    <RouterLink to="/l/people">People</RouterLink>
  </div>
  <RouterView />
</template>
