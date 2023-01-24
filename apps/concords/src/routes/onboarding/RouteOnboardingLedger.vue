<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useLocalStorage } from "@vueuse/core";
import { provideLedger } from "@/modules/ledger";
import { useIdentity } from "@/modules/identity";

const router = useRouter();
const {
  api: { auth, load },
  ledger,
} = provideLedger();

const { privateKey: privateKeyIdentity, publicKey: publicKeyIdentity } =
  useIdentity();

const ledgerStorage = useLocalStorage<string>("concords/welcome/ledger", "");

onMounted(async () => {
  await auth(privateKeyIdentity.value, publicKeyIdentity.value);
  if (ledgerStorage.value) {
    await load(JSON.parse(ledgerStorage.value));
    router.push({ path: "/welcome/ledger/builder" });
  }
});

watch(ledger, (_ledger: Object) => {
  ledgerStorage.value = JSON.stringify(_ledger);
});
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col animate"
  >
    <RouterView />
  </div>
</template>
