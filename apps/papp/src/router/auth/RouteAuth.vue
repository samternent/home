<script setup>
import { watch, nextTick } from "vue";
import { useSolid } from "@/modules/solid";
import { useRouter } from "vue-router";

const { hasSolidSession } = useSolid();
const router = useRouter();

watch(hasSolidSession, async () => {
  if (hasSolidSession.value) {
    await nextTick();
  }
});
</script>
<template>
  <VBtn v-if="hasSolidSession" to="/ledger/home">Go to ledger</VBtn>
</template>
