<script setup>
import Ledger from "../ledger/Ledger.vue";
import Encryption from "../encryption/Encryption.vue";
import Identity from "../identity/Identity.vue";
</script>
<template>
  <Identity>
    <Encryption>
      <Ledger>
        <slot />
      </Ledger>
    </Encryption>
  </Identity>
</template>
