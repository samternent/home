<script setup>
import Ledger from "../ledger/Ledger.vue";
import LoadLedger from "../ledger/LoadLedger.vue";
import Encryption from "../encryption/Encryption.vue";
import Identity from "../identity/Identity.vue";
import SetupSolid from "../solid/SetupSolid.vue";
</script>
<template>
  <Identity>
    <Encryption>
      <SetupSolid>
        <Ledger>
          <LoadLedger>
            <slot />
          </LoadLedger>
        </Ledger>
      </SetupSolid>
    </Encryption>
  </Identity>
</template>
