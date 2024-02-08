<script setup>
import Ledger from "../ledger/Ledger.vue";
import LoadLedger from "../ledger/LoadLedger.vue";
import Encryption from "../encryption/Encryption.vue";
import Identity from "../identity/Identity.vue";
</script>
<template>
  <Identity>
    <Encryption>
      <Ledger>
        <LoadLedger>
          <slot />
        </LoadLedger>
      </Ledger>
    </Encryption>
  </Identity>
</template>
