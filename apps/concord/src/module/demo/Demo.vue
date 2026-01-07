<script setup lang="ts">
import Concord from "../concord/Concord.vue";
import DemoIdentity from "./DemoIdentity.vue";
import DemoEncryption from "./DemoEncryption.vue";
import DemoCreateLedger from "./DemoCreateLedger.vue";
</script>
<template>
  <div class="h-screen w-screen flex flex-col">
    <Concord>
      <div class="flex-1 flex flex-col gap-4">
        <DemoIdentity />
        <DemoEncryption />
        <DemoCreateLedger />
      </div>
    </Concord>
  </div>
</template>
