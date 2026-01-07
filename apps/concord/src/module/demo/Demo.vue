<script setup lang="ts">
import Concord from "../concord/Concord.vue";
import Identity from "./DemoIdentity.vue";
import Encryption from "./DemoEncryption.vue";
import CreateLedger from "./DemoCreateLedger.vue";
</script>
<template>
  <div class="h-screen w-screen flex flex-col">
    <Concord>
      <div class="flex-1 flex flex-col gap-4">
        <Identity />
        <Encryption />
        <CreateLedger />
      </div>
    </Concord>
  </div>
</template>
