<script setup>
import Ledger from "../ledger/Ledger.vue";
import Encryption from "../encryption/Encryption.vue";
import Identity from "../identity/Identity.vue";
import Profile from "../profile/Profile.vue";
</script>
<template>
  <Identity>
    <Encryption>
      <Profile>
        <Ledger>
          <slot />
        </Ledger>
      </Profile>
    </Encryption>
  </Identity>
</template>
