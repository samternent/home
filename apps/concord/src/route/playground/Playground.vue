<script setup lang="ts">
import Concord from "../../module/concord/Concord.vue";
import Identity from "../../module/demo/Identity.vue";
import Encryption from "../../module/demo/Encryption.vue";
import CreateLedger from "../../module/demo/CreateLedger.vue";
</script>
<template>
  <div class="h-screen w-screen flex flex-col">
    <Concord>
      <header class="p-2 border-b border-gray-300 flex items-center space-x-4">
        <a class="brand" href="/">Concord</a>
      </header>
      <div class="flex-1 flex flex-col">
        <div class="flex-1 flex flex-col gap-4">
          <Identity />
          <Encryption />
          <CreateLedger />
        </div>
      </div>
    </Concord>
  </div>
</template>
