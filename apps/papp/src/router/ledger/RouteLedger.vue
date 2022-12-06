<script setup>
import { Ledger } from "@/modules/ledger";
</script>
<template>
  <Ledger>
    <header class="flex px-4 py-2">
      <div>
        <h1 class="font-light text-lg text-white">
          <span class="font-bold text-xl"
            >secret-document-board-view-project</span
          >.concord.json
        </h1>
        <h2 class="text-sm font-light text-blue-500">
          <strong>An open-source, digital ledger ecosystem:</strong>
          private; encrypted; verifiable & tamper-proof.
        </h2>
      </div>
    </header>
    <div>
      <VTabs bg-color="" center-active>
        <VTab to="/ledger/home">Home</VTab>
        <VTab to="/ledger/people">People</VTab>
        <VTab to="/ledger/permissions">Permissions</VTab>
      </VTabs>
    </div>
    <RouterView />
  </Ledger>
</template>
