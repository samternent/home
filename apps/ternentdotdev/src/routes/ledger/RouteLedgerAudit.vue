<script setup>
import { useBreadcrumbs } from "@/module/breadcrumbs/useBreadcrumbs";
import LedgerAuditLog from "@/module/ledger/LedgerAuditLog.vue";

useBreadcrumbs({
  path: "/ledger/audit",
  name: "Audit Trail",
});
</script>

<template>
  <div class="flex flex-col flex-1 max-w-full overflow-hidden">
    <LedgerAuditLog />
  </div>
</template>
