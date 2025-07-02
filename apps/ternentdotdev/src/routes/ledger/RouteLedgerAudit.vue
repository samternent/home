<template>
  <div class="flex flex-col flex-1 w-full h-full">
    <LedgerAuditLog />
  </div>
</template>

<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import LedgerAuditLog from "@/module/ledger/LedgerAuditLog.vue";

useBreadcrumbs({
  path: "/ledger/audit",
  name: "Audit Trail",
});
</script>
