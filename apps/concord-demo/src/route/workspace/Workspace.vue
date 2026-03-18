<script setup lang="ts">
import Concord from "../../module/concord/Concord.vue";
</script>
<template>
  <ClientOnly>
    <Concord>
      <RouterView />
    </Concord>
  </ClientOnly>
</template>
