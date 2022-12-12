<script lang="ts" setup>
import { onMounted, shallowRef, watchEffect } from "vue";
import {
  generate as createIdentity,
  exportPublicKey,
  exportSigningKey,
} from "@concords/identity";

const keys = shallowRef(null);
onMounted(async () => {
  keys.value = await createIdentity();
});
const publicKey = shallowRef();
const privateKey = shallowRef();

watchEffect(async () => {
  if (keys.value) {
    publicKey.value = await exportPublicKey(keys.value?.publicKey);
    privateKey.value = await exportSigningKey(keys.value?.privateKey);
  }
});
</script>
<template>
  <div
    class="w-full flex-1 mx-auto max-w-6xl px-2 flex justify-center flex-col"
  >
    <h1
      v-if="keys"
      class="text-3xl md:text-5xl text-[#d3d3d3] font-light tracking-tighter mt-12 md:mt-16"
    >
      <!-- concords.app -->
    </h1>
    <div class="text-2xl md:text-4xl text-[#adadad] pt-4 font-thin">
      <span class="text-pink-500 font-medium">Concord: </span>
      <span class="text-yellow-500">noun.</span>
      <p>agreement or harmony between people or groups.</p>
      <p class="mt-4 text-xl">
        <span class="text-xl font-medium text-yellow-500">Secure by design</span
        >. <strong>ECDSA Identity & Age Encryption</strong> protected document
        data files.
      </p>
      <ul class="text-lg my-8 px-4">
        <li class="pl-2">Granular permissions with Age encryption.</li>
        <li class="pl-2">Tamper-proof data structure.</li>
        <li class="pl-2">ECDSA signed transations.</li>
        <li class="pl-2">Works completely offline.</li>
        <li class="pl-2">Git inspired commit based workflow.</li>
        <li class="pl-2">
          Storage agnostic. Supports raw and encrypted JSON download/upload.
        </li>
      </ul>
      <div class="break-all">{{ publicKey }}</div>
      <div class="break-all">{{ privateKey }}</div>
    </div>
  </div>
  <footer
    class="p-4 text-white md:flex md:items-center md:justify-between md:p-6"
  >
    <span class="text-sm sm:text-center text-gray-200">
      <a href="https://www.concords.app/" class="league-link"
        >Team Concords Limited</a
      >
      © 2022.
    </span>
    <ul class="flex flex-wrap items-center mt-3 text-sm text-gray-400 sm:mt-0">
      <!-- <li>
        <RouterLink to="/company/about" class="mr-4 hover:underline md:mr-6"
          >About</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/legal/privacy" class="mr-4 hover:underline md:mr-6"
          >Privacy Policy</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/legal/terms" class="mr-4 hover:underline md:mr-6"
          >Terms of Use</RouterLink
        >
      </li>
      <li>
        <RouterLink to="/company/contact" class="mr-4 hover:underline md:mr-6"
          >Contact</RouterLink
        >
      </li> -->
    </ul>
  </footer>
</template>
<style>
@counter-style repeating-emoji {
  system: cyclic;
  symbols: "🔒" "🔐" "🔏" "⚡" "🤓" "💾";
  suffix: " ";
}

ul {
  list-style-type: repeating-emoji;
}
</style>
