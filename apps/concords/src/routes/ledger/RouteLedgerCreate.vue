<script lang="ts" setup>
import { onMounted, ShallowRef, shallowRef, watchEffect } from "vue";
import {
  createIdentity,
  exportPublicKeyAsPem,
  exportPrivateKeyAsPem,
} from "@concords/identity";

const keys: ShallowRef<CryptoKeyPair | null> = shallowRef(null);

onMounted(async () => {
  keys.value = await createIdentity();
});
const publicKey: ShallowRef<string | null> = shallowRef(null);
const privateKey: ShallowRef<string | null> = shallowRef(null);

watchEffect(async () => {
  if (keys.value) {
    publicKey.value = await exportPublicKeyAsPem(keys.value?.publicKey);
    privateKey.value = await exportPrivateKeyAsPem(keys.value?.privateKey);
  }
});
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-8 flex justify-center flex-col"
  >
    <div
      class="text-3xl text-white pt-4 font-light animate w-full flex flex-col"
    >
      <span class="font-medium text-5xl my-8">Choose UI type</span>
      <!-- <input
        type="text"
        id="concord-title"
        name="concord-title"
        class="flex-1 bg-[#1d1d1d] border-b-2 text-center border-white text-5xl font-thin px-2 rounded py-1"
        placeholder="File name..."
      /> -->
      <div class="grid grid-cols-4 gap-2">
        <RouterLink
          to="/l/create/board"
          class="flex-1 bg-[#1d1d1d] border-b-2 text-center border-white text-5xl font-thin px-2 rounded py-3"
        >
          Board
        </RouterLink>
        <RouterLink
          to="/l/create/list"
          class="flex-1 bg-[#1d1d1d] border-b-2 text-center border-white text-5xl font-thin px-2 rounded py-3"
        >
          List
        </RouterLink>
        <RouterLink
          to="/l/create/table"
          class="flex-1 bg-[#1d1d1d] border-b-2 text-center border-white text-5xl font-thin px-2 rounded py-3"
        >
          Table
        </RouterLink>
        <RouterLink
          to="/l/create/form"
          class="flex-1 bg-[#1d1d1d] border-b-2 text-center border-white text-5xl font-thin px-2 rounded py-3"
        >
          Form
        </RouterLink>
      </div>
    </div>
  </div>
</template>
<style>
.animate {
  animation-duration: 0.5s;
  animation-name: animate-fade;
  animation-fill-mode: backwards;
}

@keyframes animate-fade {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
